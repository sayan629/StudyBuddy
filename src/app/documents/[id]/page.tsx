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
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">
      {/* Background Decorative Aura Blobs */}
      <div className="aura-blob blob-purple w-96 h-96 -top-20 -left-20" />
      <div className="aura-blob blob-cyan w-96 h-96 top-1/2 -right-20" />
      <div className="aura-blob blob-pink w-80 h-80 bottom-10 left-1/3" />

      <Navbar />

      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8 sm:px-8 space-y-6 relative z-10">
        {/* Navigation & Document Title Header */}
        <div className="space-y-3 glass-panel p-6 rounded-3xl border border-violet-400/20 shadow-md">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="uppercase text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm">
                  {document.source_type}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  Added {new Date(document.created_at).toLocaleDateString()}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-mono font-semibold text-violet-600 dark:text-violet-400">
                  {document.raw_text.length.toLocaleString()} characters
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight">
                {document.title}
              </h1>
            </div>
          </div>
        </div>

        {/* 3 Study Tabs: Summary | Flashcards | Quiz */}
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md h-12 p-1.5 bg-muted/70 rounded-2xl border border-violet-400/20 backdrop-blur shadow-sm">
            <TabsTrigger
              value="summary"
              className="gap-2 text-xs sm:text-sm font-heading font-bold rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <BookOpen className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="flashcards"
              className="gap-2 text-xs sm:text-sm font-heading font-bold rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <Layers className="h-4 w-4" />
              Flashcards
              {flashcards && flashcards.length > 0 && (
                <span className="ml-1 text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-white/20">
                  {flashcards.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="quiz"
              className="gap-2 text-xs sm:text-sm font-heading font-bold rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <CheckSquare className="h-4 w-4" />
              Quiz
              {questions.length > 0 && (
                <span className="ml-1 text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-white/20">
                  {questions.length}
                </span>
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

