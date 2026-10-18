'use client';

import * as React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function SignUpPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const supabase = createClient();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup&next=/auth/verified`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Check if user session was created immediately (email confirmation turned off in Supabase)
      if (data.session) {
        window.location.href = '/dashboard';
      } else {
        setSuccessMessage('Account created! Please check your email inbox to confirm your account before logging in.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) {
        const errorMsg = oauthError.message.toLowerCase().includes('provider')
          ? 'Google Sign-In is not enabled yet in your Supabase project. Please enable Google under Authentication > Providers in the Supabase Dashboard, or sign up with email and password below.'
          : oauthError.message;
        setError(errorMsg);
        setGoogleLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Google';
      setError(message);
      setGoogleLoading(false);
    }
  };

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
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 font-heading font-extrabold text-2xl tracking-tight">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 text-white shadow-xl animate-float-1">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-gradient-rainbow">StudyBuddy</span>
          </Link>
          <p className="text-xs text-muted-foreground font-sans">Your AI-powered study assistant</p>
        </div>

        <Card className="rainbow-border-card border-0 shadow-2xl overflow-hidden relative">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-heading font-extrabold tracking-tight">Create an account</CardTitle>
            <CardDescription className="text-xs">
              Start mastering notes with AI summaries, flashcards, and quizzes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2.5 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs leading-relaxed">{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="py-2.5 border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-xl">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <AlertDescription className="text-xs leading-relaxed">{successMessage}</AlertDescription>
              </Alert>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 font-heading font-semibold rounded-xl border-violet-300/40 dark:border-violet-700/40 hover:bg-muted/60 transition-all shadow-xs"
              onClick={handleGoogleSignUp}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-500" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Sign up with Google
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-[11px] font-mono uppercase tracking-wider">
                <span className="bg-card px-2 text-muted-foreground">Or with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="font-heading font-semibold text-xs">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-violet-300/40 dark:border-violet-700/40 h-10 text-xs focus-visible:ring-violet-500"
                  required
                  autoComplete="email"
                  disabled={loading || googleLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="font-heading font-semibold text-xs">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-violet-300/40 dark:border-violet-700/40 h-10 text-xs focus-visible:ring-violet-500"
                  required
                  autoComplete="new-password"
                  disabled={loading || googleLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="font-heading font-semibold text-xs">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl border-violet-300/40 dark:border-violet-700/40 h-10 text-xs focus-visible:ring-violet-500"
                  required
                  autoComplete="new-password"
                  disabled={loading || googleLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 gradient-cosmic shimmer-button text-white font-heading font-bold rounded-xl shadow-lg hover:opacity-95 transition-all"
                disabled={loading || googleLoading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-4">
            <p className="text-xs text-muted-foreground font-sans">
              Already have an account?{' '}
              <Link href="/login" className="text-violet-600 dark:text-violet-400 font-bold hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

