import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export const HOURLY_GENERATION_LIMIT = 20;

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  error?: string;
}

export async function checkAndRecordAiUsage(
  supabase: SupabaseClient<Database>,
  userId: string,
  action: 'summary' | 'flashcards' | 'quiz'
): Promise<RateLimitResult> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Count usage in the last 1 hour
  const { data: recentUsage, error: countError } = await supabase
    .from('user_ai_usage')
    .select('id, created_at')
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: true });

  if (countError) {
    console.error('Error checking rate limit:', countError);
    // In case of query error, proceed to avoid blocking user, but log
    return { allowed: true, remaining: 1 };
  }

  const currentCount = recentUsage?.length || 0;

  if (currentCount >= HOURLY_GENERATION_LIMIT) {
    const oldestTimestamp = recentUsage[0]?.created_at;
    let minutesLeft = 60;
    if (oldestTimestamp) {
      const resetTime = new Date(oldestTimestamp).getTime() + 60 * 60 * 1000;
      minutesLeft = Math.max(1, Math.ceil((resetTime - Date.now()) / (60 * 1000)));
    }

    return {
      allowed: false,
      error: `Hourly rate limit reached (${HOURLY_GENERATION_LIMIT} AI generations/hour). Please wait ~${minutesLeft} minute(s) before generating again.`,
    };
  }

  // Record usage
  await supabase.from('user_ai_usage').insert({
    user_id: userId,
    action,
  });

  return {
    allowed: true,
    remaining: HOURLY_GENERATION_LIMIT - (currentCount + 1),
  };
}
