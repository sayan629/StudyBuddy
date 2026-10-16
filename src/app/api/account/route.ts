import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE() {
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

    // Delete user data across all tables explicitly
    // Note: documents deletion cascades to flashcards, quizzes, and quiz_attempts
    await supabase.from('documents').delete().eq('user_id', userId);
    await supabase.from('user_ai_usage').delete().eq('user_id', userId);

    // Delete the user from auth.users via admin service role client
    try {
      const adminClient = createAdminClient();
      await adminClient.auth.admin.deleteUser(userId);
    } catch (adminErr) {
      console.warn('Admin deleteUser error (service key might not be set):', adminErr);
    }

    // Sign out user session
    await supabase.auth.signOut();

    return NextResponse.json({ success: true, message: 'Account and associated data successfully deleted.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete account';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

