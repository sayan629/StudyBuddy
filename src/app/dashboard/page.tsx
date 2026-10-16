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

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 sm:px-8 space-y-8">
        {/* Welcome & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Study Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your AI-generated summaries, spaced repetition cards, and performance metrics
            </p>
          </div>
          <Link href="/dashboard/upload">
            <Button className="gap-2 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              Upload Material
            </Button>
          </Link>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Due Today */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cards Due Today
              </CardTitle>
              <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                <Calendar className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{stats?.cardsDueToday ?? 0}</div>
                  <span className="text-xs text-muted-foreground">
                    of {stats?.totalCards ?? 0} total
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Average Quiz Score */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Avg Quiz Score
              </CardTitle>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Award className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{stats?.averageQuizScore ?? 0}%</div>
                  <span className="text-xs text-muted-foreground">
                    {stats?.totalQuizzesTaken ?? 0} attempt{stats?.totalQuizzesTaken === 1 ? '' : 's'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Study Streak */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Study Streak
              </CardTitle>
              <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                <Flame className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">
                    {stats?.studyStreak ?? 0} {stats?.studyStreak === 1 ? 'day' : 'days'}
                  </div>
                  <span className="text-xs text-muted-foreground">Keep it up!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Documents in Library */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Document Library
              </CardTitle>
              <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                <BookOpen className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{stats?.totalDocuments ?? 0}</div>
                  <span className="text-xs text-muted-foreground">Saved sets</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        <div>
          {loading ? (
            <Card className="border-border/80">
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
              <h2 className="text-xl font-bold tracking-tight">Your Study Documents</h2>
              <p className="text-xs text-muted-foreground">
                Select a document to study summaries, flashcards, or take a quiz
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-border/80">
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
            <Card className="border-dashed border-2 py-12 text-center">
              <CardContent className="flex flex-col items-center justify-center space-y-3">
                <FileText className="h-10 w-10 text-muted-foreground/60" />
                <h3 className="font-semibold text-lg">
                  {searchQuery ? 'No documents match your search' : 'No documents uploaded yet'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {searchQuery
                    ? 'Try searching with another keyword.'
                    : 'Upload your first PDF or lecture notes to generate AI summaries, flashcards, and quizzes.'}
                </p>
                {!searchQuery && (
                  <Link href="/dashboard/upload" className="pt-2">
                    <Button size="sm" className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Upload Notes Now
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  className="group border-border/80 hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary" className="uppercase text-[10px] font-bold">
                        {doc.source_type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-70 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocToDelete(doc);
                        }}
                        title="Delete document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-base font-semibold leading-snug line-clamp-2 mt-2">
                      {doc.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Uploaded {new Date(doc.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pb-3">
                    <div className="flex items-center gap-2">
                      {doc.summary ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <Sparkles className="h-3.5 w-3.5" />
                          Summary Ready
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Ready for AI analysis
                        </span>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 border-t border-border/50">
                    <Link href={`/documents/${doc.id}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full gap-1.5 justify-between font-medium">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete document?
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
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDocument}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Document'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

