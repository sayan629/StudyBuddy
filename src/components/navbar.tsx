'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLogo } from '@/components/brand-logo';
import { User, LogOut, Trash2, PlusCircle, LayoutDashboard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  React.useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data?.user?.email ?? null);
    }
    loadUser();

    // Listen to auth state transitions to immediately sync or clear email
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUserEmail(null);
      } else if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    setLoggingOut(true);
    // Instantly wipe email state from UI
    setUserEmail(null);
    try {
      await supabase.auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      toast.success('Logged out successfully');
      // Full browser navigation guarantees immediate transition & clean state without needing a manual refresh
      window.location.href = '/login';
    } catch {
      toast.error('Failed to log out');
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setUserEmail(null);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete account');
      }
      toast.success('Your account and all associated data have been permanently deleted.');
      setDeleteDialogOpen(false);
      window.location.href = '/login';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      toast.error(message);
      setDeleting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 tracking-tight group">
              <BrandLogo size="sm" />
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              <Link href="/dashboard">
                <Button
                  variant={pathname === '/dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  className={`gap-1.5 font-medium text-xs sm:text-sm ${
                    pathname === '/dashboard'
                      ? 'animated-bg text-white border-0 shadow-sm hover:opacity-90'
                      : 'hover:text-violet-600 dark:hover:text-violet-400'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/upload">
                <Button
                  variant={pathname === '/dashboard/upload' ? 'default' : 'ghost'}
                  size="sm"
                  className={`gap-1.5 font-medium text-xs sm:text-sm ${
                    pathname === '/dashboard/upload'
                      ? 'animated-bg text-white border-0 shadow-sm hover:opacity-90'
                      : 'hover:text-violet-600 dark:hover:text-violet-400'
                  }`}
                >
                  <PlusCircle className="h-4 w-4" />
                  New Upload
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-9 items-center gap-2 rounded-full border border-violet-200/60 dark:border-violet-800/40 bg-violet-50/60 dark:bg-violet-950/30 px-3 text-xs font-medium hover:bg-violet-100/80 dark:hover:bg-violet-900/40 outline-none cursor-pointer transition-colors">
                <div className="flex h-5 w-5 items-center justify-center rounded-full animated-bg text-white shadow-sm">
                  <User className="h-3 w-3" />
                </div>
                <span className="hidden md:inline max-w-[120px] truncate text-xs font-medium text-violet-700 dark:text-violet-300">
                  {userEmail || 'Account'}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
                    <p className="truncate text-xs font-semibold gradient-text-static">
                      {userEmail || 'User'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push('/dashboard')}
                  className="cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/upload')}
                  className="cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Upload Notes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="cursor-pointer"
                >
                  {loggingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Log out
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete account &amp; data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>


      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete account and all data?
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              This action cannot be undone. All your uploaded documents, study notes, AI-generated summaries, flashcards, quiz history, and user profile will be permanently deleted from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Permanently Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

