import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const reviewSchema = z.object({
  result: z.enum(['correct', 'wrong']),
});

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
        { error: 'Unauthorized: Session missing or expired' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected { result: "correct" | "wrong" }' },
        { status: 400 }
      );
    }

    const { result } = parsed.data;

    // Fetch existing card
    const { data: card, error: cardError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        { error: 'Flashcard not found or not owned by you.' },
        { status: 404 }
      );
    }

    let nextReviewDate: string;
    let newTimesCorrect = card.times_correct;
    let newTimesWrong = card.times_wrong;

    if (result === 'correct') {
      newTimesCorrect += 1;
      // Spaced repetition interval:
      // 1st correct -> 1 day
      // 2nd correct -> 3 days
      // 3rd or more correct -> 7 days
      let daysToAdd = 1;
      if (newTimesCorrect === 2) {
        daysToAdd = 3;
      } else if (newTimesCorrect >= 3) {
        daysToAdd = 7;
      }

      nextReviewDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    } else {
      // Wrong answer:
      // Reset correct streak and schedule review for tomorrow (1 day)
      newTimesWrong += 1;
      newTimesCorrect = 0;
      nextReviewDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { data: updatedCard, error: updateError } = await supabase
      .from('flashcards')
      .update({
        times_correct: newTimesCorrect,
        times_wrong: newTimesWrong,
        next_review_date: nextReviewDate,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      flashcard: updatedCard,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

