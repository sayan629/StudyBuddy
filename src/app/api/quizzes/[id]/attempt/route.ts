import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const attemptSchema = z.object({
  score: z.number().int().min(0),
  total: z.number().int().min(1),
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
    const parsed = attemptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid attempt data. Expected { score: number, total: number }' },
        { status: 400 }
      );
    }

    const { score, total } = parsed.data;

    // Verify quiz ownership
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: 'Quiz not found or not owned by you.' },
        { status: 404 }
      );
    }

    const { data: attempt, error: insertError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        quiz_id: id,
        score,
        total,
      })
      .select('*')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      attempt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
