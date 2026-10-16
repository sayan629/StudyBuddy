-- ============================================================
-- Grant table-level privileges to roles.
-- In Supabase, enabling RLS is NOT enough on its own — you must
-- also GRANT the relevant privileges to the `authenticated` role
-- (used by logged-in users via the anon key) and to `service_role`
-- (used by server-side admin clients with the service role key).
-- ============================================================

-- DOCUMENTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO service_role;

-- FLASHCARDS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO service_role;

-- QUIZZES
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO service_role;

-- QUIZ QUESTIONS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO service_role;

-- QUIZ ATTEMPTS
GRANT SELECT, INSERT, DELETE ON public.quiz_attempts TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.quiz_attempts TO service_role;

-- USER AI USAGE (rate limiting)
GRANT SELECT, INSERT ON public.user_ai_usage TO authenticated;
GRANT SELECT, INSERT ON public.user_ai_usage TO service_role;

