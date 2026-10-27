-- The application authenticates through its Express API and connects as the
-- private PostgreSQL role. Never expose credential hashes or allow direct
-- unauthenticated account/audit writes through the Supabase Data API.
-- This migration changes grants and policies only; it does not alter rows.

BEGIN;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view official directory" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can insert officials" ON public.users;

DROP POLICY IF EXISTS "Students can view own profile" ON public.students;
DROP POLICY IF EXISTS "Students can update own profile" ON public.students;
DROP POLICY IF EXISTS "Allow portal user registration" ON public.students;

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

REVOKE ALL ON TABLE public.users, public.students FROM PUBLIC, anon, authenticated;
REVOKE INSERT ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated;

COMMIT;
