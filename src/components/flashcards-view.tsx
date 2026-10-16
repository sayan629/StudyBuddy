'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { FlashcardRow } from '@/types/database.types';
import {
  Layers,
  Sparkles,
  RefreshCw,
  Check,
  X,
  RotateCw,
  ArrowRight,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';

interface FlashcardsViewProps {
  documentId: string;
  initialFlashcards?: FlashcardRow[];
}

export function FlashcardsView({
  documentId,
  initialFlashcards = [],
}: FlashcardsViewProps) {
  const [cards, setCards] = React.useState<FlashcardRow[]>(initialFlashcards);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Filter state: show only cards due today
  const [onlyDueToday, setOnlyDueToday] = React.useState(false);

  // Study session states
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [sessionCompleted, setSessionCompleted] = React.useState(false);
  const [sessionCorrectCount, setSessionCorrectCount] = React.useState(0);
  const [sessionWrongCount, setSessionWrongCount] = React.useState(0);
  const [submittingReview, setSubmittingReview] = React.useState(false);

  const isDue = (card: FlashcardRow) => {
    return new Date(card.next_review_date) <= new Date();
  };

  const filteredCards = React.useMemo(() => {
    if (!onlyDueToday) return cards;
    return cards.filter(isDue);
  }, [cards, onlyDueToday]);

  const dueTodayCount = React.useMemo(() => {
    return cards.filter(isDue).length;
  }, [cards]);

  const currentCard = filteredCards[currentIndex];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/flashcards`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate flashcards.');
      }
      setCards(data.flashcards || []);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionCompleted(false);
      setSessionCorrectCount(0);
      setSessionWrongCount(0);
      toast.success(`Generated ${data.flashcards.length} flashcards!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error generating flashcards';
      setError(message);
      toast.error('Failed to generate flashcards.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReview = async (result: 'correct' | 'wrong') => {
    if (!currentCard || submittingReview) return;
    setSubmittingReview(true);

    try {
      const res = await fetch(`/api/flashcards/${currentCard.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      // Update card in state
      setCards((prev) =>
        prev.map((c) => (c.id === currentCard.id ? data.flashcard : c))
      );

      if (result === 'correct') {
        setSessionCorrectCount((c) => c + 1);
        toast.success('Got it! Pushed next review forward.', { duration: 1500 });
      } else {
        setSessionWrongCount((c) => c + 1);
        toast.info('Missed it! Rescheduled for tomorrow.', { duration: 1500 });
      }

      // Advance to next card or complete session
      if (currentIndex + 1 < filteredCards.length) {
        setIsFlipped(false);
        setCurrentIndex((i) => i + 1);
      } else {
        setSessionCompleted(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Review error';
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Keyboard navigation shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (sessionCompleted || filteredCards.length === 0) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key === '1' || e.code === 'ArrowLeft') {
        if (isFlipped) {
          e.preventDefault();
          handleReview('wrong');
        }
      } else if (e.key === '2' || e.code === 'ArrowRight') {
        if (isFlipped) {
          e.preventDefault();
          handleReview('correct');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, sessionCompleted, filteredCards.length, currentCard]);

  const restartStudySession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setSessionCorrectCount(0);
    setSessionWrongCount(0);
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Spaced Repetition Flashcards
          </h2>
          <p className="text-sm text-muted-foreground">
            Active recall with SM-2 spaced repetition (1d, 3d, 7d intervals)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {cards.length > 0 && (
            <div className="flex items-center gap-2 bg-muted/50 border border-border px-3 py-1.5 rounded-lg">
              <Switch
                id="due-today"
                checked={onlyDueToday}
                onCheckedChange={(checked) => {
                  setOnlyDueToday(checked);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setSessionCompleted(false);
                }}
              />
              <Label htmlFor="due-today" className="text-xs cursor-pointer font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Due Today ({dueTodayCount})
              </Label>
            </div>
          )}

          <Button
            variant={cards.length > 0 ? 'outline' : 'default'}
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2 shadow-sm"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : cards.length > 0 ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating
              ? 'Generating...'
              : cards.length > 0
              ? 'Regenerate Cards'
              : 'Generate Flashcards'}
          </Button>
        </div>
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
              onClick={handleGenerate}
              className="mt-2 h-7 text-xs bg-background text-foreground hover:bg-muted"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Skeleton className="h-[280px] w-full max-w-xl rounded-2xl" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
      )}

      {/* Main Flashcard Interface */}
      {!isGenerating && cards.length > 0 && (
        <>
          {filteredCards.length === 0 ? (
            <Card className="border-dashed border-2 py-12 text-center">
              <CardContent className="flex flex-col items-center justify-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <h3 className="font-semibold text-lg">All caught up!</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  You have no cards due for review today. Great work staying on schedule!
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOnlyDueToday(false)}
                  className="mt-2"
                >
                  Study All Cards ({cards.length})
                </Button>
              </CardContent>
            </Card>
          ) : sessionCompleted ? (
            /* Session Completed Screen */
            <Card className="max-w-xl mx-auto text-center border-border shadow-md py-8">
              <CardContent className="space-y-6">
                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Trophy className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold">Session Completed!</h3>
                  <p className="text-sm text-muted-foreground">
                    You reviewed {filteredCards.length} flashcards in this session.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto py-2">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {sessionCorrectCount}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">Mastered</p>
                  </div>
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                      {sessionWrongCount}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">Needs Review</p>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  <Button onClick={restartStudySession} className="gap-2">
                    <RotateCw className="h-4 w-4" />
                    Review Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Active Flashcard View */
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Progress info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                  Card {currentIndex + 1} of {filteredCards.length}
                </span>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize text-[11px]">
                    {currentCard?.difficulty || 'Medium'}
                  </Badge>
                  <span>
                    Streak: {currentCard?.times_correct || 0} correct
                  </span>
                </div>
              </div>

              <Progress
                value={((currentIndex + 1) / filteredCards.length) * 100}
                className="h-1.5"
              />

              {/* 3D Flip Card Container */}
              <div
                className="perspective-1000 cursor-pointer min-h-[300px] select-none"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div
                  className={`relative w-full h-[300px] transition-transform duration-500 rounded-2xl transform-style-3d shadow-md hover:shadow-lg border border-border bg-card p-6 flex flex-col justify-between ${
                    isFlipped ? 'rotate-y-180 bg-muted/40' : ''
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* Front: Question */}
                  <div
                    className="absolute inset-0 p-8 flex flex-col justify-between backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>Question</span>
                      <span className="text-[11px] font-normal lowercase text-muted-foreground">
                        Click card or press Space to reveal
                      </span>
                    </div>

                    <div className="my-auto text-center px-4">
                      <p className="text-lg sm:text-xl font-medium leading-relaxed text-foreground">
                        {currentCard?.question}
                      </p>
                    </div>

                    <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                      <RotateCw className="h-3.5 w-3.5" />
                      Tap card to flip
                    </div>
                  </div>

                  {/* Back: Answer */}
                  <div
                    className="absolute inset-0 p-8 flex flex-col justify-between backface-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <div className="flex justify-between items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      <span>Answer</span>
                      <span className="text-[11px] font-normal lowercase text-muted-foreground">
                        Rate your recall below
                      </span>
                    </div>

                    <div className="my-auto text-center px-4">
                      <p className="text-base sm:text-lg leading-relaxed text-foreground font-normal">
                        {currentCard?.answer}
                      </p>
                    </div>

                    <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                      <span>Next review: +{currentCard?.times_correct === 0 ? '1d' : currentCard?.times_correct === 1 ? '3d' : '7d'} if got it</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (currentIndex > 0) {
                      setIsFlipped(false);
                      setCurrentIndex((i) => i - 1);
                    }
                  }}
                  disabled={currentIndex === 0 || submittingReview}
                  className="gap-1.5 text-xs text-muted-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>

                {isFlipped ? (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => handleReview('wrong')}
                      disabled={submittingReview}
                      className="border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 gap-1.5 font-medium px-4"
                      title="Shortcut: Press '1' or Left Arrow"
                    >
                      <X className="h-4 w-4" />
                      Missed it (1)
                    </Button>
                    <Button
                      variant="default"
                      size="default"
                      onClick={() => handleReview('correct')}
                      disabled={submittingReview}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-medium px-4"
                      title="Shortcut: Press '2' or Right Arrow"
                    >
                      <Check className="h-4 w-4" />
                      Got it (2)
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsFlipped(true)}
                    className="gap-2 px-6"
                  >
                    <RotateCw className="h-4 w-4" />
                    Flip Card (Space)
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (currentIndex + 1 < filteredCards.length) {
                      setIsFlipped(false);
                      setCurrentIndex((i) => i + 1);
                    }
                  }}
                  disabled={currentIndex + 1 >= filteredCards.length || submittingReview}
                  className="gap-1.5 text-xs text-muted-foreground"
                >
                  Skip
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isGenerating && cards.length === 0 && !error && (
        <Card className="border-dashed border-2 py-12 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full">
              <Layers className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base">No flashcards yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Generate 10-20 active recall flashcards with spaced repetition intervals from your document.
              </p>
            </div>
            <Button onClick={handleGenerate} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Flashcards
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
