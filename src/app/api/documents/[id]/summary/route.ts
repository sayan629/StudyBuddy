import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateStudySummary } from '@/lib/gemini';
import { checkAndRecordAiUsage } from '@/lib/rate-limiter';

export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Session missing or expired. Please sign in again.' },
        { status: 401 }
      );
    }

    // Retrieve document for this user
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, title, raw_text, summary, key_points')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found or you do not have permission to access it.' },
        { status: 404 }
      );
    }

    if (!document.raw_text || document.raw_text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Document contains insufficient text to generate a summary. Please upload or add more notes.' },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimit = await checkAndRecordAiUsage(supabase, user.id, 'summary');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.error || 'Rate limit reached. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate summary with Gemini
    const result = await generateStudySummary(document.raw_text, document.title);

    // Save summary and key_points to Supabase
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        summary: result.summary,
        key_points: result.key_points,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to save summary to database: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      summary: result.summary,
      key_points: result.key_points,
      remainingGenerations: rateLimit.remaining,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate study summary';
    return NextResponse.json(
      { error: `AI Generation Error: ${message}. Please check your GEMINI_API_KEY or retry in a few moments.` },
      { status: 500 }
    );
  }
}
