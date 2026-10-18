'use client';

import * as React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { StatsChart } from '@/components/stats-chart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookOpen,
  PlusCircle,
  Search,
  Calendar,
  Flame,
  Award,
  FileText,
  Trash2,
  ArrowRight,
  Sparkles,
  Loader2,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentItem {
  id: string;
  title: string;
  source_type: 'pdf' | 'txt' | 'md' | 'paste';
  summary: string | null;
  created_at: string;
}

interface StatsData {
  totalDocuments: number;
  totalCards: number;
  cardsDueToday: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  studyStreak: number;
  scoreOverTime: Array<{ date: string; score: number; rawDate: string }>;
}

export default function DashboardPage() {
  const [documents, setDocuments] = React.useState<DocumentItem[]>([]);
  const [stats, setStats] = React.useState<StatsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Delete modal state
  const [docToDelete, setDocToDelete] = React.useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const [docsRes, statsRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/stats'),
      ]);

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/documents/${docToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete document');
      }

      toast.success(`Deleted "${docToDelete.title}"`);
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
      setDocToDelete(null);
      // Refresh stats
      fetch('/api/stats')
        .then((r) => r.json())
        .then((s) => setStats(s))
        .catch(() => {});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete error';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSourceBadgeStyle = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-gradient-to-r from-rose-500 to-red-600 text-white font-mono shadow-sm';
      case 'md':
        return 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono shadow-sm';
      case 'txt':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-mono shadow-sm';
      case 'paste':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-mono shadow-sm';
      default:
        return 'bg-secondary text-secondary-foreground font-mono';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">
      {/* Background Decorative Aura Blobs */}
      <div className="aura-blob blob-purple w-96 h-96 -top-20 -left-20" />
      <div className="aura-blob blob-cyan w-96 h-96 top-1/3 -right-20" />
      <div className="aura-blob blob-pink w-80 h-80 bottom-20 left-1/4" />

      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 sm:px-8 space-y-8 relative z-10">
        {/* Welcome & Quick Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-violet-400/20 shadow-lg">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-semibold mb-1">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <span>Smart Study Space</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">
              Study <span className="text-gradient-rainbow">Dashboard</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Your AI-generated summaries, spaced repetition cards, and performance curves
            </p>
          </div>

          <Link href="/dashboard/upload">
            <Button className="gradient-cosmic shimmer-button text-white font-semibold shadow-lg hover:opacity-95 transition-all gap-2 h-11 px-6 rounded-2xl">
              <PlusCircle className="h-4 w-4" />
              Upload Material
            </Button>
          </Link>
        </div>

        {/* Motivation Sticky Note (Handwritten Font Showcase) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-3">
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Due Today */}
              <Card className="rainbow-border-card border-0 shadow-md hover:shadow-xl transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                    Due Today
                  </CardTitle>
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl shadow-md animate-float-1">
                    <Calendar className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="flex items-baseline justify-between">
                      <div className="font-display text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                        {stats?.cardsDueToday ?? 0}
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        of {stats?.totalCards ?? 0} cards
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 2: Average Quiz Score */}
              <Card className="rainbow-border-card border-0 shadow-md hover:shadow-xl transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                    Avg Quiz Score
                  </CardTitle>
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-md animate-float-2">
                    <Award className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="flex items-baseline justify-between">
                      <div className="font-display text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        {stats?.averageQuizScore ?? 0}%
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        {stats?.totalQuizzesTaken ?? 0} attempt{stats?.totalQuizzesTaken === 1 ? '' : 's'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 3: Study Streak */}
              <Card className="rainbow-border-card border-0 shadow-md hover:shadow-xl transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                    Study Streak
                  </CardTitle>
                  <div className="p-2.5 bg-gradient-to-br from-amber-500 to-rose-500 text-white rounded-xl shadow-md animate-bounce-subtle">
                    <Flame className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="flex items-baseline justify-between">
                      <div className="font-display text-3xl font-extrabold text-amber-500 dark:text-amber-400">
                        {stats?.studyStreak ?? 0}
                      </div>
                      <span className="text-xs font-display font-medium text-muted-foreground">
                        {stats?.studyStreak === 1 ? 'day active' : 'days fire 🔥'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 4: Documents in Library */}
              <Card className="rainbow-border-card border-0 shadow-md hover:shadow-xl transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                    Library
                  </CardTitle>
                  <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-xl shadow-md animate-float-1">
                    <BookOpen className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="flex items-baseline justify-between">
                      <div className="font-display text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">
                        {stats?.totalDocuments ?? 0}
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">saved docs</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Handwritten Study Note Widget */}
          <div className="sticky-note p-4 rounded-2xl flex flex-col justify-between space-y-2 h-full min-h-[140px]">
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider opacity-80">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Study Buddy Note</span>
            </div>
            <p className="font-handwritten text-xl leading-tight font-bold">
              &quot;Reviewing flashcards within 24 hours locks in 70% more knowledge!&quot;
            </p>
            <div className="text-[11px] font-mono opacity-70 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>Keep your streak glowing!</span>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div>
          {loading ? (
            <Card className="rainbow-border-card border-0">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : (
            <StatsChart data={stats?.scoreOverTime || []} />
          )}
        </div>

        {/* Document Library Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-heading font-extrabold tracking-tight">
                Your Study Materials
              </h2>
              <p className="text-xs text-muted-foreground">
                Select a document to review summaries, practice spaced repetition flashcards, or take a quiz
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-violet-500" />
              <Input
                placeholder="Search study documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl border-violet-300/40 dark:border-violet-700/40 focus-visible:ring-violet-500 bg-background/80 backdrop-blur"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="rainbow-border-card border-0 p-4">
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <Card className="border-dashed border-2 border-violet-400/30 rounded-3xl py-12 text-center bg-card/40 backdrop-blur">
              <CardContent className="flex flex-col items-center justify-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center text-violet-500 animate-bounce-subtle">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="font-heading font-bold text-lg">
                  {searchQuery ? 'No documents match your search' : 'No study materials uploaded yet'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {searchQuery
                    ? 'Try searching with another keyword.'
                    : 'Upload your lecture PDF, markdown notes, or pasted textbook text to instantly generate AI summaries and interactive cards.'}
                </p>
                {!searchQuery && (
                  <Link href="/dashboard/upload" className="pt-2">
                    <Button size="sm" className="gradient-cosmic text-white font-semibold gap-2 rounded-xl shadow-md">
                      <PlusCircle className="h-4 w-4" />
                      Upload Notes Now
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  className="group rainbow-border-card interactive-card border-0 flex flex-col justify-between overflow-hidden shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded-lg ${getSourceBadgeStyle(doc.source_type)}`}>
                        {doc.source_type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocToDelete(doc);
                        }}
                        title="Delete document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="font-heading text-base font-bold leading-snug line-clamp-2 mt-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {doc.title}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono">
                      Uploaded {new Date(doc.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pb-3">
                    <div className="flex items-center gap-2">
                      {doc.summary ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-display">
                          <Sparkles className="h-3.5 w-3.5" />
                          Summary Ready
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-sans">
                          Ready for AI analysis
                        </span>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 border-t border-border/40">
                    <Link href={`/documents/${doc.id}`} className="w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5 justify-between font-semibold rounded-xl border-violet-300/40 dark:border-violet-700/40 hover:bg-gradient-to-r hover:from-violet-500 hover:to-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        Study Notes
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Document Confirmation Modal */}
      <Dialog open={Boolean(docToDelete)} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-destructive/20 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-destructive font-heading flex items-center gap-2">
              <div className="p-2 bg-destructive/10 rounded-xl">
                <Trash2 className="h-5 w-5" />
              </div>
              Delete study document?
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Are you sure you want to delete <strong>&quot;{docToDelete?.title}&quot;</strong>? This will permanently remove all associated AI summaries, flashcards, practice quizzes, and quiz attempt scores.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              onClick={() => setDocToDelete(null)}
              disabled={deleting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDocument}
              disabled={deleting}
              className="rounded-xl"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Permanently Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
