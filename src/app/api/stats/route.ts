import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
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

    const userId = user.id;
    const nowIso = new Date().toISOString();

    // 1. Documents count
    const { count: totalDocuments } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 2. Flashcards count & due today count
    const { count: totalCards } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: cardsDueToday } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('next_review_date', nowIso);

    // 3. Quiz attempts history & score over time
    const { data: attempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('id, score, total, taken_at, quiz_id')
      .eq('user_id', userId)
      .order('taken_at', { ascending: true });

    if (attemptsError) {
      console.error('Error fetching quiz attempts:', attemptsError);
    }

    const attemptsList = attempts || [];
    const totalQuizzesTaken = attemptsList.length;

    let averageQuizScore = 0;
    if (totalQuizzesTaken > 0) {
      const totalPercent = attemptsList.reduce(
        (acc, curr) => acc + (curr.total > 0 ? (curr.score / curr.total) * 100 : 0),
        0
      );
      averageQuizScore = Math.round(totalPercent / totalQuizzesTaken);
    }

    // Prepare chronological score-over-time data for Recharts
    const scoreOverTime = attemptsList.map((att) => {
      const percentage = att.total > 0 ? Math.round((att.score / att.total) * 100) : 0;
      const dateLabel = new Date(att.taken_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      return {
        date: dateLabel,
        score: percentage,
        rawDate: att.taken_at,
      };
    });

    // 4. Study streak calculation: consecutive active days leading to today/yesterday
    const activeDates = new Set<string>();
    attemptsList.forEach((att) => {
      activeDates.add(new Date(att.taken_at).toISOString().split('T')[0]);
    });

    // Also include document creation dates
    const { data: recentDocs } = await supabase
      .from('documents')
      .select('created_at')
      .eq('user_id', userId);

    recentDocs?.forEach((d) => {
      activeDates.add(new Date(d.created_at).toISOString().split('T')[0]);
    });

    let streak = 0;
    const today = new Date();
    // Check backwards from today or yesterday
    const checkDate = new Date(today);
    const todayStr = checkDate.toISOString().split('T')[0];

    // If no activity today, check if active yesterday to continue streak
    if (!activeDates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (activeDates.has(checkDate.toISOString().split('T')[0])) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return NextResponse.json({
      totalDocuments: totalDocuments || 0,
      totalCards: totalCards || 0,
      cardsDueToday: cardsDueToday || 0,
      totalQuizzesTaken,
      averageQuizScore,
      studyStreak: streak,
      scoreOverTime,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

