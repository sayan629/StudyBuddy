import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateQuiz } from '@/lib/gemini';
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

    // Get latest quiz for this document
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title, created_at')
      .eq('document_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (quizError) {
      return NextResponse.json({ error: quizError.message }, { status: 500 });
    }

    if (!quiz) {
      return NextResponse.json({ quiz: null, questions: [], attempts: [] });
    }

    // Get questions for this quiz
    const { data: questions, error: qError } = await supabase
      .from('quiz_questions')
      .select('id, question, options, correct_index, explanation')
      .eq('quiz_id', quiz.id);

    if (qError) {
      return NextResponse.json({ error: qError.message }, { status: 500 });
    }

    // Get attempts for this quiz
    const { data: attempts, error: aError } = await supabase
      .from('quiz_attempts')
      .select('id, score, total, taken_at')
      .eq('quiz_id', quiz.id)
      .eq('user_id', user.id)
      .order('taken_at', { ascending: false });

    if (aError) {
      return NextResponse.json({ error: aError.message }, { status: 500 });
    }

    return NextResponse.json({
      quiz,
      questions: questions || [],
      attempts: attempts || [],
    });
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
        { error: 'Document contains insufficient text to generate a quiz.' },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimit = await checkAndRecordAiUsage(supabase, user.id, 'quiz');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.error || 'Rate limit reached. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate quiz with Gemini
    const result = await generateQuiz(document.raw_text, document.title);

    // Delete existing quizzes for this document (cascades to questions & attempts)
    await supabase.from('quizzes').delete().eq('document_id', id).eq('user_id', user.id);

    // Insert new quiz
    const { data: newQuiz, error: insertQuizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: user.id,
        document_id: id,
        title: result.title || `${document.title} - Quiz`,
      })
      .select('*')
      .single();

    if (insertQuizError || !newQuiz) {
      return NextResponse.json(
        { error: `Failed to create quiz: ${insertQuizError?.message}` },
        { status: 500 }
      );
    }

    // Insert questions
    const questionsToInsert = result.questions.map((q) => ({
      quiz_id: newQuiz.id,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation,
    }));

    const { data: insertedQuestions, error: insertQuestionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert)
      .select('*');

    if (insertQuestionsError) {
      return NextResponse.json(
        { error: `Failed to save quiz questions: ${insertQuestionsError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quiz: newQuiz,
      questions: insertedQuestions,
      remainingGenerations: rateLimit.remaining,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate quiz';
    return NextResponse.json(
      { error: `AI Quiz Error: ${message}` },
      { status: 500 }
    );
  }
}
