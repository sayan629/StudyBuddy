import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  BookOpen, Sparkles, Layers, CheckSquare, ArrowRight,
  Upload, Brain, TrendingUp, Zap, Star, Shield, Lightbulb,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">
      {/* Background Decorative Aura Blobs */}
      <div className="aura-blob blob-purple w-[550px] h-[550px] -top-32 -left-32" />
      <div className="aura-blob blob-cyan w-[500px] h-[500px] -top-20 -right-20" />
      <div className="aura-blob blob-pink w-[450px] h-[450px] top-1/2 left-1/3" />

      {/* ── Navbar ── */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 text-white shadow-lg animate-float-1">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-heading font-extrabold text-xl text-gradient-rainbow">StudyBuddy</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-heading font-semibold text-xs sm:text-sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="gradient-cosmic shimmer-button text-white font-heading font-bold shadow-lg border-0 hover:opacity-95 transition-all rounded-xl"
              >
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {/* ── Hero ── */}
        <section className="relative container mx-auto max-w-6xl px-4 py-16 sm:py-28 flex flex-col items-center text-center">

          {/* Badge */}
          <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-400/40 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-heading font-semibold mb-8 animate-bounce-subtle">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span>Powered by Google Gemini AI</span>
            <span className="h-2 w-2 rounded-full bg-violet-500 animate-ping" />
          </div>

          {/* Headline */}
          <h1 className="font-heading text-5xl sm:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.08]">
            Turn any notes into{' '}
            <span className="text-gradient-rainbow">exam mastery</span>
            {' '}in seconds.
          </h1>

          {/* Sub-headline */}
          <p className="mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed font-sans">
            Upload PDFs, Markdown, or raw lecture notes. Instantly get structured AI summaries,
            spaced-repetition flashcards, and adaptive practice quizzes — all tailored to your content.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-9 text-base font-heading font-bold gradient-cosmic shimmer-button text-white border-0 shadow-2xl hover:opacity-95 transition-all gap-2 rounded-2xl neon-glow"
              >
                Start Studying Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 text-base font-heading font-semibold rounded-2xl border-violet-300/60 dark:border-violet-700/60 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 hover:border-violet-500 transition-all shadow-sm"
              >
                Sign in to your library
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5 font-sans"><Shield className="h-3.5 w-3.5 text-emerald-500" />Private &amp; client-side</span>
            <span className="flex items-center gap-1.5 font-sans"><Zap className="h-3.5 w-3.5 text-amber-500" />Instant generation</span>
            <span className="flex items-center gap-1.5 font-sans"><Star className="h-3.5 w-3.5 text-violet-500" />100% Free to use</span>
          </div>

          {/* Handwritten Study Tip Floating Hero Widget */}
          <div className="mt-12 max-w-md w-full">
            <div className="sticky-note p-5 rounded-3xl text-left space-y-2 shadow-xl animate-float-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-80">
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4" />
                  Study Buddy Hack
                </span>
                <span className="font-mono text-[10px]">Active Recall</span>
              </div>
              <p className="font-handwritten text-2xl font-bold leading-snug">
                &quot;Testing yourself with flashcards before looking at the answers builds 3x stronger memory!&quot;
              </p>
            </div>
          </div>
        </section>

        {/* ── Feature cards ── */}
        <section className="container mx-auto max-w-6xl px-4 pb-20 sm:pb-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1 */}
            <div className="rainbow-border-card interactive-card rounded-3xl p-7 space-y-4 shadow-xl border-0">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg animate-float-1">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-xl mb-2">AI Summaries &amp; Key Points</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  Break down dense textbook chapters into concise, digestible overviews and high-yield key takeaways — chunked for even the longest documents.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-display text-violet-600 dark:text-violet-400 font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>5–8 high-impact takeaways</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rainbow-border-card interactive-card rounded-3xl p-7 space-y-4 shadow-xl border-0">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg animate-float-2">
                <Layers className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-xl mb-2">Spaced Repetition Flashcards</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  Study cards with smooth 3D flip animations. Intelligent scheduling pushes cards to 1, 3, or 7 days based on your mastery performance.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-display text-cyan-600 dark:text-cyan-400 font-bold">
                <Zap className="h-3.5 w-3.5" />
                <span>10–20 cards with SM-2 intervals</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rainbow-border-card interactive-card rounded-3xl p-7 space-y-4 shadow-xl border-0">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center shadow-lg animate-float-1">
                <CheckSquare className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-xl mb-2">Adaptive Practice Quizzes</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  Test comprehension with 4-choice multiple-choice quizzes. Get immediate explanations for wrong answers and track scores over time.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-display text-emerald-600 dark:text-emerald-400 font-bold">
                <Star className="h-3.5 w-3.5" />
                <span>Instant reasoning explanations</span>
              </div>
            </div>
          </div>

          {/* ── Bottom highlight strip ── */}
          <div className="mt-14 rainbow-border-card border-0 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-5 text-left">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shrink-0 animate-float-1">
                  <Upload className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-lg mb-1">Client-side PDF Extraction</h4>
                  <p className="text-xs text-muted-foreground font-sans">
                    Your PDFs are parsed directly in your browser using <code className="font-mono text-violet-600 dark:text-violet-400 font-bold">pdfjs-dist</code>. Fast, private, and compatible with cloud payload limits.
                  </p>
                </div>
              </div>

              <div className="hidden md:block w-px h-12 bg-border/40" />

              <div className="flex items-center gap-5 text-left">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shrink-0 animate-float-2">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-lg mb-1">Track Your Growth</h4>
                  <p className="text-xs text-muted-foreground font-sans">
                    Visual comprehension charts, study streaks, daily review alerts, and score history keep your exam prep on track.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-8 bg-card/30 backdrop-blur relative z-10">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-sm">
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <span className="font-heading font-bold text-foreground">StudyBuddy</span>
            <span className="font-mono">© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>Powered by Gemini AI &amp; Next.js 15</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
