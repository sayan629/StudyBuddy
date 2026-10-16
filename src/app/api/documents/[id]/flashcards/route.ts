import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateFlashcards } from '@/lib/gemini';
import { checkAndRecordAiUsage } from '@/lib/rate-limiter';

export const maxDuration = 60;

export async function GET(
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
        { error: 'Unauthorized: Session missing or expired' },
        { status: 401 }
      );
    }

    const { data: flashcards, error: cardsError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('document_id', id)
      .eq('user_id', user.id)
      .order('next_review_date', { ascending: true });

    if (cardsError) {
      return NextResponse.json({ error: cardsError.message }, { status: 500 });
    }

    return NextResponse.json({ flashcards: flashcards || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    // Retrieve document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, title, raw_text')
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
        { error: 'Document contains insufficient text to generate flashcards.' },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimit = await checkAndRecordAiUsage(supabase, user.id, 'flashcards');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.error || 'Rate limit reached. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate flashcards with Gemini
    const result = await generateFlashcards(document.raw_text, document.title);

    // If existing flashcards exist, delete them to regenerate fresh ones
    await supabase.from('flashcards').delete().eq('document_id', id).eq('user_id', user.id);

    // Initial review date is right now (due immediately for learning)
    const nowIso = new Date().toISOString();

    const cardsToInsert = result.flashcards.map((card) => ({
      user_id: user.id,
      document_id: id,
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty,
      times_correct: 0,
      times_wrong: 0,
      next_review_date: nowIso,
    }));

    const { data: insertedCards, error: insertError } = await supabase
      .from('flashcards')
      .insert(cardsToInsert)
      .select('*');

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to save flashcards: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      flashcards: insertedCards,
      remainingGenerations: rateLimit.remaining,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate flashcards';
    return NextResponse.json(
      { error: `AI Flashcards Error: ${message}` },
      { status: 500 }
    );
  }
}

