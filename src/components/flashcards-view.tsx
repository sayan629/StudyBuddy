'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  const handleReview = React.useCallback(async (result: 'correct' | 'wrong') => {
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
  }, [currentCard, submittingReview, currentIndex, filteredCards.length]);

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
  }, [isFlipped, sessionCompleted, filteredCards.length, handleReview]);

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
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1 font-mono">
                <span className="font-heading font-semibold text-foreground">
                  Card {currentIndex + 1} <span className="text-muted-foreground font-normal">of {filteredCards.length}</span>
                </span>
                <div className="flex items-center gap-2">
                  <Badge className="capitalize text-[10px] font-mono px-2 py-0.5 rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-400/30">
                    {currentCard?.difficulty || 'Medium'}
                  </Badge>
                  <span className="text-[11px] font-display text-amber-500 font-bold">
                    🔥 {currentCard?.times_correct || 0} streak
                  </span>
                </div>
              </div>

              {/* Animated Rainbow Progress Bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-rainbow transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
                />
              </div>

              {/* 3D Flip Card Container */}
              <div
                className="perspective-1000 cursor-pointer min-h-[320px] select-none py-2"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div
                  className={`relative w-full h-[320px] transition-transform duration-500 rounded-3xl transform-style-3d shadow-xl hover:shadow-2xl rainbow-border-card border-0 p-8 flex flex-col justify-between overflow-hidden ${
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
                    <div className="flex justify-between items-center text-xs font-heading font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Prompt Question
                      </span>
                      <span className="text-[11px] font-mono lowercase text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        Press Space to flip
                      </span>
                    </div>

                    <div className="my-auto text-center px-4">
                      <p className="font-heading text-xl sm:text-2xl font-bold leading-relaxed text-foreground">
                        {currentCard?.question}
                      </p>
                    </div>

                    <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2 font-mono">
                      <RotateCw className="h-3.5 w-3.5 animate-spin-slow text-violet-500" />
                      <span>Click anywhere to reveal answer</span>
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
                    <div className="flex justify-between items-center text-xs font-heading font-bold text-emerald-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Answer
                      </span>
                      <span className="text-[11px] font-mono lowercase text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        Rate your recall below
                      </span>
                    </div>

                    <div className="my-auto text-center px-4">
                      <p className="font-sans text-base sm:text-xl leading-relaxed text-foreground font-medium">
                        {currentCard?.answer}
                      </p>
                    </div>

                    <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5 font-mono">
                      <span>Interval next: +{currentCard?.times_correct === 0 ? '1d' : currentCard?.times_correct === 1 ? '3d' : '7d'} if mastered</span>
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
                  className="gap-1.5 text-xs text-muted-foreground rounded-xl"
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
                      className="border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white gap-1.5 font-heading font-bold px-5 rounded-xl shadow-sm transition-all"
                      title="Shortcut: Press '1' or Left Arrow"
                    >
                      <X className="h-4 w-4" />
                      Missed it
                      <span className="font-mono text-[10px] opacity-70 ml-1">[1]</span>
                    </Button>
                    <Button
                      size="default"
                      onClick={() => handleReview('correct')}
                      disabled={submittingReview}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white gap-1.5 font-heading font-bold px-5 rounded-xl shadow-md hover:opacity-95 transition-all"
                      title="Shortcut: Press '2' or Right Arrow"
                    >
                      <Check className="h-4 w-4" />
                      Got it!
                      <span className="font-mono text-[10px] opacity-80 ml-1">[2]</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsFlipped(true)}
                    className="gap-2 px-6 rounded-xl font-heading font-semibold border-violet-400/40 hover:bg-violet-500 hover:text-white transition-all shadow-sm"
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

