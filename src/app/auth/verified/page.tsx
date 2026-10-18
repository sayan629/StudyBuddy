'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function VerifiedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = React.useState(3);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/login?verified=true';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background overflow-hidden">
      {/* Background Decorative Aura Blobs */}
      <div className="aura-blob blob-purple w-96 h-96 -top-20 -left-20" />
      <div className="aura-blob blob-cyan w-96 h-96 -bottom-20 -right-20" />
      <div className="aura-blob blob-pink w-80 h-80 top-1/2 left-10" />

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 font-heading font-extrabold text-2xl tracking-tight">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 text-white shadow-xl animate-float-1">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-gradient-rainbow">StudyBuddy</span>
          </Link>
          <p className="text-xs text-muted-foreground font-sans">Your AI-powered study companion</p>
        </div>

        {/* Verification Success Card */}
        <Card className="rainbow-border-card border-0 shadow-2xl overflow-hidden relative text-center py-8 px-4">
          <CardHeader className="space-y-3 pb-2">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-xl animate-bounce-subtle">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <CardTitle className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
              Verified <span className="text-gradient-rainbow">Successfully!</span>
            </CardTitle>

            <CardDescription className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans max-w-xs mx-auto">
              Your email address has been verified. Your account is ready for AI summaries, flashcards, and quizzes.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* 3-Second Countdown Indicator */}
            <div className="rounded-2xl border border-violet-400/30 bg-muted/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-semibold font-sans">
                  <Sparkles className="h-3.5 w-3.5" />
                  Auto-redirecting to login
                </span>
                <span className="font-display font-bold text-violet-500 text-sm">
                  {countdown}s
                </span>
              </div>

              {/* Animated Progress Countdown Bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-rainbow transition-all duration-1000 ease-linear"
                  style={{ width: `${((4 - countdown) / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Direct Instant Action Button */}
            <Button
              onClick={() => {
                window.location.href = '/login?verified=true';
              }}
              className="w-full h-11 gradient-cosmic shimmer-button text-white font-heading font-bold rounded-xl shadow-lg hover:opacity-95 transition-all gap-2"
            >
              Go to Login Page Now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

