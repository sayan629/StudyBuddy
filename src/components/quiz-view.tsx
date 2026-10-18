'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { QuizQuestionRow, QuizAttemptRow, QuizRow } from '@/types/database.types';
import {
  CheckSquare,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  History,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface QuizViewProps {
  documentId: string;
  initialQuiz?: QuizRow | null;
  initialQuestions?: QuizQuestionRow[];
  initialAttempts?: QuizAttemptRow[];
}

export function QuizView({
  documentId,
  initialQuiz = null,
  initialQuestions = [],
  initialAttempts = [],
}: QuizViewProps) {
  const [quiz, setQuiz] = React.useState<QuizRow | null>(initialQuiz);
  const [questions, setQuestions] = React.useState<QuizQuestionRow[]>(initialQuestions);
  const [attempts, setAttempts] = React.useState<QuizAttemptRow[]>(initialAttempts);

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, number>>({});
  const [showExplanationForCurrent, setShowExplanationForCurrent] = React.useState(false);
  const [isQuizFinished, setIsQuizFinished] = React.useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const hasQuestions = questions.length > 0;

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/quiz`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate quiz.');
      }

      setQuiz(data.quiz);
      setQuestions(data.questions || []);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowExplanationForCurrent(false);
      setIsQuizFinished(false);
      toast.success(`Generated quiz with ${data.questions.length} questions!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error generating quiz';
      setError(message);
      toast.error('Failed to generate quiz.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (showExplanationForCurrent) return; // Prevent changing after revealing
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswers[currentQuestionIndex] === undefined) {
      toast.error('Please select an option first.');
      return;
    }
    setShowExplanationForCurrent(true);
  };

  const handleNextQuestion = async () => {
    setShowExplanationForCurrent(false);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Finish Quiz and save attempt
      await finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!quiz) return;
    setIsQuizFinished(true);

    // Calculate score
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_index) {
        score += 1;
      }
    });

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          total: questions.length,
        }),
      });

      const data = await res.json();
      if (res.ok && data.attempt) {
        setAttempts((prev) => [data.attempt, ...prev]);
        toast.success(`Quiz complete! You scored ${score} / ${questions.length}`);
      }
    } catch {
      toast.error('Could not save quiz attempt.');
    }
  };

  const retakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowExplanationForCurrent(false);
    setIsQuizFinished(false);
  };

  // Calculate final score
  const finalScore = React.useMemo(() => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_index) {
        score += 1;
      }
    });
    return score;
  }, [questions, selectedAnswers]);

  const percentage = questions.length > 0 ? Math.round((finalScore / questions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            {quiz?.title || 'Interactive Practice Quiz'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Test your comprehension with 4-choice questions and instant explanations
          </p>
        </div>

        <Button
          variant={hasQuestions ? 'outline' : 'default'}
          size="sm"
          onClick={handleGenerateQuiz}
          disabled={isGenerating}
          className="gap-2 shadow-sm"
        >
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : hasQuestions ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating
            ? 'Generating...'
            : hasQuestions
            ? 'Regenerate Quiz'
            : 'Generate Practice Quiz'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Generation Failed</AlertTitle>
          <AlertDescription className="text-xs space-y-2">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateQuiz}
              className="mt-2 h-7 text-xs bg-background text-foreground hover:bg-muted"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {isGenerating && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Quiz Taking Interface */}
      {!isGenerating && hasQuestions && !isQuizFinished && currentQuestion && (
        <Card className="max-w-2xl mx-auto rainbow-border-card border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <CardHeader className="space-y-3 relative z-10">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span className="font-heading font-semibold text-foreground">
                  Question {currentQuestionIndex + 1} <span className="text-muted-foreground font-normal">of {questions.length}</span>
                </span>
                <span className="text-[11px] font-display font-bold text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Multiple Choice
                </span>
              </div>
              
              {/* Rainbow animated progress bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-rainbow transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              <CardTitle className="font-heading text-xl sm:text-2xl font-bold pt-2 leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 relative z-10">
              {(currentQuestion.options as string[]).map((option, idx) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                const isCorrect = idx === currentQuestion.correct_index;

                let customStyle = 'border-violet-300/30 dark:border-violet-800/30 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 hover:border-violet-400 text-left';

                if (showExplanationForCurrent) {
                  if (isCorrect) {
                    customStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 font-semibold shadow-md';
                  } else if (isSelected && !isCorrect) {
                    customStyle = 'border-rose-500 bg-rose-500/15 text-rose-950 dark:text-rose-200 font-semibold shadow-md';
                  } else {
                    customStyle = 'border-border/30 opacity-40';
                  }
                } else if (isSelected) {
                  customStyle = 'border-violet-500 bg-violet-500/15 text-foreground font-semibold ring-2 ring-violet-500 shadow-md';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    disabled={showExplanationForCurrent}
                    className={`w-full p-4 rounded-2xl text-sm transition-all flex items-start gap-3.5 border ${customStyle}`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground font-display font-bold text-xs shadow-xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 text-left font-sans pt-0.5 leading-relaxed">{option}</span>

                    {showExplanationForCurrent && isCorrect && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5 animate-bounce-subtle" />
                    )}
                    {showExplanationForCurrent && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}

              {/* Explanation box after answer confirmation */}
              {showExplanationForCurrent && (
                <Alert className="mt-4 border-violet-400/40 bg-violet-500/10 rounded-2xl">
                  <HelpCircle className="h-4 w-4 text-violet-500" />
                  <AlertTitle className="text-xs font-heading font-bold">Concept Explanation</AlertTitle>
                  <AlertDescription className="text-xs leading-relaxed text-foreground mt-1 font-sans">
                    {currentQuestion.explanation}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="flex justify-between border-t border-border/40 pt-4 relative z-10">
              <span className="text-xs text-muted-foreground font-mono">
                {showExplanationForCurrent
                  ? selectedAnswers[currentQuestionIndex] === currentQuestion.correct_index
                    ? '✨ Correct answer!'
                    : '💡 Take note of the explanation.'
                  : 'Select an option and confirm'}
              </span>

              {showExplanationForCurrent ? (
                <Button
                  onClick={handleNextQuestion}
                  className="gradient-cosmic shimmer-button text-white font-heading font-bold gap-2 rounded-xl shadow-md"
                >
                  {currentQuestionIndex + 1 < questions.length ? (
                    <>
                      Next Question
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      View Results
                      <Trophy className="h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleConfirmAnswer}
                  disabled={selectedAnswers[currentQuestionIndex] === undefined}
                  className="gradient-cosmic shimmer-button text-white font-heading font-bold gap-2 rounded-xl shadow-md disabled:opacity-50"
                >
                  Confirm Answer
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

      {/* Quiz Results Screen */}
      {!isGenerating && isQuizFinished && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="rainbow-border-card border-0 shadow-2xl text-center py-8 overflow-hidden relative">
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="relative z-10">
              <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 text-white flex items-center justify-center mb-3 shadow-xl animate-float-1">
                <Trophy className="h-10 w-10" />
              </div>
              <CardTitle className="text-3xl font-heading font-extrabold tracking-tight">
                Quiz <span className="text-gradient-rainbow">Completed!</span>
              </CardTitle>
              <CardDescription className="text-sm">
                {percentage >= 80
                  ? '🌟 Outstanding! You have thoroughly mastered this study material.'
                  : percentage >= 60
                  ? '⚡ Good effort! Review the explanations below to solidify your understanding.'
                  : '💪 Keep practicing! Active recall builds long-term neural connections.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
                <div className="rounded-2xl border border-violet-400/30 bg-muted/40 p-5 w-40 shadow-sm">
                  <p className="font-display text-4xl font-extrabold text-gradient-rainbow">{percentage}%</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">Score</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/30 bg-muted/40 p-5 w-40 shadow-sm">
                  <p className="font-display text-4xl font-extrabold text-emerald-500">
                    {finalScore} <span className="text-lg font-normal text-muted-foreground">/ {questions.length}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">Correct</p>
                </div>
              </div>

              {/* Handwritten celebration sticky note */}
              <div className="max-w-md mx-auto my-6">
                <div className="sticky-note p-4 rounded-2xl text-center space-y-1 shadow-md">
                  <p className="font-handwritten text-2xl font-bold">
                    {percentage >= 80 ? '🎉 Exam Ready! You crushed this quiz!' : '📖 Review the missed questions below to level up!'}
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-4">
                <Button onClick={retakeQuiz} variant="outline" className="gap-2 rounded-xl font-heading font-semibold">
                  <RotateCcw className="h-4 w-4" />
                  Retake Quiz
                </Button>
                <Button onClick={handleGenerateQuiz} className="gradient-cosmic shimmer-button text-white gap-2 rounded-xl font-heading font-bold shadow-md">
                  <Sparkles className="h-4 w-4" />
                  Generate New Quiz
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Question Review with Explanations */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Detailed Question Review</h3>
            {questions.map((q, idx) => {
              const selected = selectedAnswers[idx];
              const isCorrect = selected === q.correct_index;

              return (
                <Card
                  key={idx}
                  className={`border transition-colors ${
                    isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-rose-500/30 bg-rose-500/5'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-relaxed">
                        {idx + 1}. {q.question}
                      </p>
                      <Badge
                        variant={isCorrect ? 'default' : 'destructive'}
                        className="text-xs shrink-0"
                      >
                        {isCorrect ? 'Correct' : 'Missed'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p className="text-muted-foreground">
                      Your answer:{' '}
                      <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 dark:text-rose-400 font-medium'}>
                        {selected !== undefined ? (q.options as string[])[selected] : 'Not answered'}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-muted-foreground">
                        Correct answer:{' '}
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {(q.options as string[])[q.correct_index]}
                        </span>
                      </p>
                    )}
                    <div className="pt-2 border-t border-border/50 text-foreground">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Past Attempts Table */}
          {attempts.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Past Attempts History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border text-xs">
                  {attempts.slice(0, 5).map((att) => (
                    <div key={att.id} className="py-2.5 flex justify-between items-center">
                      <span className="text-muted-foreground">
                        {new Date(att.taken_at).toLocaleString()}
                      </span>
                      <span className="font-semibold text-foreground">
                        {att.score} / {att.total} ({Math.round((att.score / att.total) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isGenerating && !hasQuestions && !error && (
        <Card className="border-dashed border-2 py-12 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base">No quiz generated yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Generate 5-10 multiple-choice questions with 4 options and detailed explanations from your document notes.
              </p>
            </div>
            <Button onClick={handleGenerateQuiz} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Practice Quiz
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

