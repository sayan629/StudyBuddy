'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { extractTextFromPdf, MAX_CHAR_LIMIT } from '@/lib/pdf-parser';
import {
  UploadCloud,
  FileText,
  FileCode,
  AlertTriangle,
  Info,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export function DocumentUploader() {
  const router = useRouter();

  // Mode: file upload vs paste text
  const [activeTab, setActiveTab] = React.useState<'file' | 'paste'>('file');

  // Form states
  const [title, setTitle] = React.useState('');
  const [rawText, setRawText] = React.useState('');
  const [sourceType, setSourceType] = React.useState<'pdf' | 'txt' | 'md' | 'paste'>('pdf');

  // File parsing states
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [extractProgress, setExtractProgress] = React.useState(0);
  const [extractStatus, setExtractStatus] = React.useState<string>('');
  const [isDragging, setIsDragging] = React.useState(false);

  // Warnings / Errors
  const [warning, setWarning] = React.useState<string | null>(null);
  const [isScannedPdf, setIsScannedPdf] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').trim();
    if (!title) {
      setTitle(cleanTitle);
    }
    setSelectedFileName(file.name);
    setWarning(null);
    setIsScannedPdf(false);

    if (extension === 'pdf') {
      setSourceType('pdf');
      setIsExtracting(true);
      setExtractProgress(5);
      setExtractStatus('Reading PDF file...');

      try {
        const result = await extractTextFromPdf(file, (percent, currentPage, totalPages) => {
          setExtractProgress(percent);
          setExtractStatus(`Extracting page ${currentPage} of ${totalPages}...`);
        });

        if (result.isScannedOrEmpty) {
          setIsScannedPdf(true);
          setRawText('');
          toast.error('Scanned PDF detected without readable text layer.');
        } else {
          setRawText(result.text);
          if (result.isTruncated) {
            setWarning(
              `This document was very large (${result.charCount.toLocaleString()} characters) and was capped to the first 150,000 characters to ensure optimal AI processing.`
            );
          }
          toast.success(`Successfully extracted ${result.pageCount} pages (${result.text.length.toLocaleString()} characters).`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to parse PDF.';
        toast.error(`PDF extraction error: ${message}`);
        setWarning('Could not read this PDF in browser. You can copy and paste the text directly into the "Paste Text" tab.');
      } finally {
        setIsExtracting(false);
      }
    } else if (extension === 'txt' || extension === 'md') {
      setSourceType(extension === 'md' ? 'md' : 'txt');
      setIsExtracting(true);
      setExtractProgress(50);
      setExtractStatus('Reading text file...');

      try {
        const text = await file.text();
        const trimmed = text.trim();
        if (trimmed.length === 0) {
          toast.error('The selected file is empty.');
          setRawText('');
        } else {
          const isTruncated = trimmed.length > MAX_CHAR_LIMIT;
          setRawText(isTruncated ? trimmed.slice(0, MAX_CHAR_LIMIT) : trimmed);
          if (isTruncated) {
            setWarning(
              `The file was capped at 150,000 characters (original length: ${trimmed.length.toLocaleString()} characters).`
            );
          }
          toast.success(`Loaded file with ${trimmed.length.toLocaleString()} characters.`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to read file.';
        toast.error(message);
      } finally {
        setIsExtracting(false);
        setExtractProgress(100);
      }
    } else {
      toast.error('Unsupported file format. Please upload a .pdf, .txt, or .md file.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handlePasteChange = (val: string) => {
    setSourceType('paste');
    if (val.length > MAX_CHAR_LIMIT) {
      setRawText(val.slice(0, MAX_CHAR_LIMIT));
      setWarning(
        `Pasted text exceeded the 150,000 character limit and was automatically trimmed.`
      );
    } else {
      setRawText(val);
      if (warning) setWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please provide a title for your notes.');
      return;
    }
    if (!rawText.trim() || rawText.trim().length < 10) {
      toast.error('Please upload or paste at least 10 characters of study text.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          source_type: sourceType,
          raw_text: rawText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save notes.');
      }

      toast.success('Document saved! Taking you to study mode...');
      router.push(`/documents/${data.document.id}`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save document.';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-md border-border/80">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <UploadCloud className="h-6 w-6 text-primary" />
          Upload Study Material
        </CardTitle>
        <CardDescription>
          Upload your lecture slides, textbook PDF, or markdown notes. Client-side extraction ensures quick, private processing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'file' | 'paste')}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
            <TabsTrigger value="file" className="gap-2">
              <FileText className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-2">
              <FileCode className="h-4 w-4" />
              Paste Text
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: FILE DRAG & DROP */}
          <TabsContent value="file" className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border/80 hover:border-primary/50 hover:bg-muted/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                <UploadCloud className="h-6 w-6" />
              </div>

              {selectedFileName ? (
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-foreground flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {selectedFileName}
                  </p>
                  <p className="text-xs text-muted-foreground">Click or drag another file to replace</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-foreground">
                    Click to browse or drag and drop your file here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, Markdown (.md), and Plain Text (.txt)
                  </p>
                </div>
              )}
            </div>

            {/* Extraction progress bar */}
            {isExtracting && (
              <div className="space-y-2 p-4 rounded-lg bg-muted/60 border border-border">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-2 text-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    {extractStatus}
                  </span>
                  <span className="text-muted-foreground">{extractProgress}%</span>
                </div>
                <Progress value={extractProgress} className="h-2" />
              </div>
            )}

            {/* Scanned PDF warning alert */}
            {isScannedPdf && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No readable text found</AlertTitle>
                <AlertDescription className="text-xs leading-relaxed">
                  This PDF appears to be a scanned image or photograph without an embedded text layer.
                  Please copy and paste the text manually into the <strong>Paste Text</strong> tab, or run the PDF through an OCR scanner first.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* TAB 2: PASTE TEXT */}
          <TabsContent value="paste" className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="paste-input">Paste your lecture notes or text</Label>
                <span className="text-xs text-muted-foreground">
                  {rawText.length.toLocaleString()} / {MAX_CHAR_LIMIT.toLocaleString()} chars
                </span>
              </div>
              <Textarea
                id="paste-input"
                rows={10}
                placeholder="Paste lecture notes, study guide, textbook excerpt, or flashcard content here..."
                value={rawText}
                onChange={(e) => handlePasteChange(e.target.value)}
                className="font-mono text-xs leading-relaxed"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Truncation / limit warning alert */}
        {warning && (
          <Alert className="mt-4 border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-xs font-semibold">Character Limit Notice</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed">{warning}</AlertDescription>
          </Alert>
        )}

        {/* Form Submission fields */}
        {rawText && (
          <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t border-border space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Document Title</Label>
              <Input
                id="doc-title"
                placeholder="e.g. Biology 101 - Cellular Respiration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" />
                Ready to generate AI summary, flashcards, and quizzes
              </span>
              <span>{rawText.length.toLocaleString()} characters extracted</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRawText('');
                  setSelectedFileName(null);
                  setTitle('');
                  setWarning(null);
                  setIsScannedPdf(false);
                }}
                disabled={isSubmitting}
              >
                Clear
              </Button>
              <Button type="submit" disabled={isSubmitting || !title.trim()} className="gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save & Study
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

