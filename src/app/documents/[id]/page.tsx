import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/navbar';
import { SummaryView } from '@/components/summary-view';
import { FlashcardsView } from '@/components/flashcards-view';
import { QuizView } from '@/components/quiz-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Layers, CheckSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: document } = await supabase
    .from('documents')
    .select('title')
    .eq('id', id)
    .single();

  return {
    title: document ? `${document.title} - StudyBuddy` : 'Study Document - StudyBuddy',
  };
}

export default async function DocumentStudyPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/documents/${id}`);
  }

  // Fetch document
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (docError || !document) {
    notFound();
  }

  // Fetch initial flashcards
  const { data: flashcards } = await supabase
    .from('flashcards')
    .select('*')
    .eq('document_id', id)
    .eq('user_id', user.id)
    .order('next_review_date', { ascending: true });

  // Fetch initial quiz
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('document_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch quiz questions & attempts if quiz exists
  let questions: Array<{
    id: string;
    quiz_id: string;
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
  }> = [];
  let attempts: Array<{
    id: string;
    user_id: string;
    quiz_id: string;
    score: number;
    total: number;
    taken_at: string;
  }> = [];

  if (quiz) {
    const [questionsRes, attemptsRes] = await Promise.all([
      supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id),
      supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quiz.id)
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false }),
    ]);

    if (questionsRes.data) {
      questions = questionsRes.data.map((q) => ({
        ...q,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
      }));
    }
    if (attemptsRes.data) {
      attempts = attemptsRes.data;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8 sm:px-8 space-y-6">
        {/* Navigation & Document Title Header */}
        <div className="space-y-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="uppercase text-[11px] font-bold">
                  {document.source_type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Added {new Date(document.created_at).toLocaleDateString()}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {document.raw_text.length.toLocaleString()} characters
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {document.title}
              </h1>
            </div>
          </div>
        </div>

        {/* 3 Study Tabs: Summary | Flashcards | Quiz */}
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md h-11 p-1 bg-muted/80">
            <TabsTrigger value="summary" className="gap-2 text-xs sm:text-sm font-medium">
              <BookOpen className="h-4 w-4 text-primary" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="gap-2 text-xs sm:text-sm font-medium">
              <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Flashcards
              {flashcards && flashcards.length > 0 && (
                <span className="ml-1 text-[11px] opacity-70">({flashcards.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-2 text-xs sm:text-sm font-medium">
              <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Quiz
              {questions.length > 0 && (
                <span className="ml-1 text-[11px] opacity-70">({questions.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SUMMARY */}
          <TabsContent value="summary" className="focus-visible:outline-none">
            <SummaryView
              documentId={document.id}
              initialSummary={document.summary}
              initialKeyPoints={
                Array.isArray(document.key_points) ? (document.key_points as string[]) : null
              }
            />
          </TabsContent>

          {/* TAB 2: FLASHCARDS */}
          <TabsContent value="flashcards" className="focus-visible:outline-none">
            <FlashcardsView
              documentId={document.id}
              initialFlashcards={flashcards || []}
            />
          </TabsContent>

          {/* TAB 3: QUIZ */}
          <TabsContent value="quiz" className="focus-visible:outline-none">
            <QuizView
              documentId={document.id}
              initialQuiz={quiz}
              initialQuestions={questions}
              initialAttempts={attempts}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

