import { Navbar } from '@/components/navbar';
import { DocumentUploader } from '@/components/document-uploader';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Upload Study Material - StudyBuddy',
  description: 'Upload PDF or notes to generate summaries, flashcards, and quizzes.',
};

export default function UploadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <DocumentUploader />
      </main>
    </div>
  );
}

