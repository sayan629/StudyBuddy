import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { BookOpen, Sparkles, Layers, CheckSquare, ArrowRight, Upload, Brain, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      {/* Navbar */}
      <header className="border-b border-border/60 bg-background/90 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="p-1.5 bg-primary text-primary-foreground rounded-lg shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <span>StudyBuddy</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="font-medium shadow-sm">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1">
        <section className="container mx-auto max-w-6xl px-4 py-20 sm:py-28 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Powered by Google Gemini AI</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
            Transform your notes into <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">mastery</span> in seconds.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Upload PDFs, Markdown, or raw lecture notes. Get instant structured summaries, spaced-repetition flashcards, and interactive practice quizzes tailored to your content.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold shadow-md gap-2">
                Start Studying Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
                Sign in to your library
              </Button>
            </Link>
          </div>

          {/* Quick preview features */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            <Card className="border-border/80 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">AI Summaries & Key Points</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Break down dense textbook chapters and lecture notes into concise, digestible overviews and high-yield key takeaways.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Spaced Repetition Flashcards</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Study cards with smooth flip animations. Intelligent review scheduling pushes cards to 1, 3, or 7 days based on your mastery.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Adaptive Practice Quizzes</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Test your comprehension with 4-choice interactive quizzes. Get immediate explanations for incorrect answers and track scores.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Security & Client-side parsing highlight */}
          <div className="mt-16 w-full rounded-2xl border border-border bg-card/60 p-6 sm:p-8 text-center flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-base">Client-side PDF Extraction</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Your PDF text is parsed directly in your browser. Fast, private, and compatible with cloud payload limits.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-base">Track Your Growth</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Visual performance charts, study streaks, and due review alerts keep your exam prep on track.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 bg-card/40">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} StudyBuddy. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Powered by Gemini & Next.js</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
