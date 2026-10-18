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
    <Card className="w-full max-w-4xl mx-auto rainbow-border-card border-0 shadow-2xl overflow-hidden relative">
      <div className="absolute -top-20 -right-20 w-52 h-52 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 text-white shadow-lg animate-float-1">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
              Upload <span className="text-gradient-rainbow">Study Material</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Upload lecture slides, textbook PDFs, or markdown notes. Client-side extraction ensures instant, private processing.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'file' | 'paste')}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 max-w-xs h-11 p-1 bg-muted/70 rounded-2xl border border-violet-400/20">
            <TabsTrigger value="file" className="gap-2 font-heading font-semibold text-xs sm:text-sm rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
              <FileText className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-2 font-heading font-semibold text-xs sm:text-sm rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
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
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                isDragging
                  ? 'border-violet-500 bg-violet-500/10 scale-[1.02] shadow-xl'
                  : 'border-violet-300/60 dark:border-violet-700/40 hover:border-violet-500/80 hover:bg-violet-50/30 dark:hover:bg-violet-950/20 shadow-sm'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center mb-3 shadow-lg animate-float-1">
                <UploadCloud className="h-7 w-7" />
              </div>

              {selectedFileName ? (
                <div className="space-y-1">
                  <p className="font-heading font-bold text-sm text-foreground flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {selectedFileName}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">Click or drag another file to replace</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="font-heading font-bold text-sm text-foreground">
                    Click to browse or drag and drop your study file
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    Supports <span className="text-rose-500 font-semibold">.pdf</span>, <span className="text-cyan-500 font-semibold">.md</span>, and <span className="text-emerald-500 font-semibold">.txt</span>
                  </p>
                </div>
              )}
            </div>

            {/* Extraction progress bar */}
            {isExtracting && (
              <div className="space-y-2 p-4 rounded-2xl bg-violet-500/10 border border-violet-400/30 backdrop-blur">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-foreground font-heading">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                    {extractStatus}
                  </span>
                  <span className="text-violet-600 dark:text-violet-400 font-mono font-bold">{extractProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-rainbow transition-all duration-300"
                    style={{ width: `${extractProgress}%` }}
                  />
                </div>
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
          <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t border-border/40 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title" className="font-heading font-semibold text-sm">Document Title</Label>
              <Input
                id="doc-title"
                placeholder="e.g. Biology 101 — Cellular Respiration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl border-violet-300/40 dark:border-violet-700/40 focus-visible:ring-violet-500 h-11 text-sm bg-background/80"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 font-mono">
              <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-sans font-medium">
                <Info className="h-3.5 w-3.5" />
                Ready to generate AI summary, flashcards, and quizzes
              </span>
              <span>{rawText.length.toLocaleString()} characters extracted</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
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
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="gradient-cosmic shimmer-button text-white font-heading font-bold gap-2 h-11 px-7 rounded-xl shadow-lg hover:opacity-95 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Study Notes...
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

