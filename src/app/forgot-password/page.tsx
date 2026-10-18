'use client';

import * as React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLogo } from '@/components/brand-logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background overflow-hidden">
      {/* Background Decorative Aura Blobs */}
      <div className="aura-blob blob-purple w-96 h-96 -top-20 -left-20" />
      <div className="aura-blob blob-cyan w-96 h-96 -bottom-20 -right-20" />

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="inline-flex items-center tracking-tight group">
            <BrandLogo size="lg" />
          </Link>
          <p className="text-xs text-muted-foreground font-sans">Your AI-powered study assistant</p>
        </div>

        <Card className="rainbow-border-card border-0 shadow-2xl overflow-hidden relative">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-heading font-extrabold tracking-tight">Reset password</CardTitle>
            <CardDescription className="text-xs">
              Enter your email address and we&apos;ll send you a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2.5 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs leading-relaxed">{error}</AlertDescription>
              </Alert>
            )}

            {success ? (
              <Alert className="py-3 border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-xl">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <AlertDescription className="text-xs leading-relaxed">
                  If an account exists with <strong>{email}</strong>, you will receive an email shortly with instructions to reset your password.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="font-heading font-semibold text-xs">Email address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl border-violet-300/40 dark:border-violet-700/40 h-10 text-xs focus-visible:ring-violet-500"
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 gradient-cosmic shimmer-button text-white font-heading font-bold rounded-xl shadow-lg hover:opacity-95 transition-all"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send reset link
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

