import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');
  const errorParam = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  // If Supabase returned an OAuth error or link expiration
  if (errorParam || errorDesc) {
    const errorMsg = errorDesc || errorParam || 'Authentication failed';
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  const supabase = await createClient();

  // 1. Handle PKCE code exchange (Standard OAuth & Modern Supabase Auth)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If this was an email verification flow, direct to /auth/verified
      const destination = next || (type === 'signup' || type === 'email' ? '/auth/verified' : '/dashboard');
      return NextResponse.redirect(`${origin}${destination}`);
    } else {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  // 2. Handle Token Hash Verification (Email verification links with token_hash & type)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      const destination = next || '/auth/verified';
      return NextResponse.redirect(`${origin}${destination}`);
    } else {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Could not verify authentication link. Please request a new one.')}`);
}
