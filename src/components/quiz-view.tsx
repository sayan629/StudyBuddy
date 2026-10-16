'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

  // Active quiz-taking states
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, number>>({});
  const [showExplanationForCurrent, setShowExplanationForCurrent] = React.useState(false);
  const [isQuizFinished, setIsQuizFinished] = React.useState(false);
  const [savingAttempt, setSavingAttempt] = React.useState(false);

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
    setSavingAttempt(true);

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
    } finally {
      setSavingAttempt(false);
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
        <Card className="max-w-2xl mx-auto border-border shadow-md">
          <CardHeader className="space-y-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>
                Progress: {Math.round(((currentQuestionIndex) / questions.length) * 100)}%
              </span>
            </div>
            <Progress
              value={((currentQuestionIndex + 1) / questions.length) * 100}
              className="h-1.5"
            />
            <CardTitle className="text-lg sm:text-xl font-medium pt-2 leading-relaxed">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {(currentQuestion.options as string[]).map((option, idx) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === idx;
              const isCorrect = idx === currentQuestion.correct_index;

              let buttonVariant = 'outline';
              let customStyle = 'border-border hover:bg-muted/60 text-left';

              if (showExplanationForCurrent) {
                if (isCorrect) {
                  customStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold';
                } else if (isSelected && !isCorrect) {
                  customStyle = 'border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300 font-semibold';
                } else {
                  customStyle = 'border-border/40 opacity-50';
                }
              } else if (isSelected) {
                customStyle = 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  disabled={showExplanationForCurrent}
                  className={`w-full p-4 rounded-xl text-sm transition-all flex items-start gap-3 border ${customStyle}`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 text-left">{option}</span>

                  {showExplanationForCurrent && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  {showExplanationForCurrent && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}

            {/* Explanation box after answer confirmation */}
            {showExplanationForCurrent && (
              <Alert className="mt-4 border-primary/30 bg-primary/5">
                <HelpCircle className="h-4 w-4 text-primary" />
                <AlertTitle className="text-xs font-semibold">Explanation</AlertTitle>
                <AlertDescription className="text-xs leading-relaxed text-foreground mt-1">
                  {currentQuestion.explanation}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">
              {showExplanationForCurrent
                ? selectedAnswers[currentQuestionIndex] === currentQuestion.correct_index
                  ? 'Correct answer!'
                  : 'Incorrect answer.'
                : 'Select an option and confirm'}
            </span>

            {showExplanationForCurrent ? (
              <Button onClick={handleNextQuestion} className="gap-2">
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
                className="gap-2"
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
          <Card className="border-border shadow-md text-center py-6">
            <CardHeader>
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Trophy className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold">Quiz Results</CardTitle>
              <CardDescription>
                {percentage >= 80
                  ? 'Outstanding! You have thoroughly mastered this material.'
                  : percentage >= 60
                  ? 'Good effort! Review the explanations below to solidify your understanding.'
                  : 'Keep practicing! Review the concepts and try again.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
                <div className="rounded-2xl border border-border p-4 w-36">
                  <p className="text-3xl font-extrabold text-foreground">{percentage}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Score</p>
                </div>
                <div className="rounded-2xl border border-border p-4 w-36">
                  <p className="text-3xl font-extrabold text-foreground">
                    {finalScore} / {questions.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Correct Answers</p>
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-6">
                <Button onClick={retakeQuiz} variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retake Quiz
                </Button>
                <Button onClick={handleGenerateQuiz} className="gap-2">
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
