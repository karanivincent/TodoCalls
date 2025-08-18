-- Option 1: Disable RLS temporarily (quickest fix)
ALTER TABLE public.contact_messages DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS, use this instead:
-- DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
-- CREATE POLICY "Allow public inserts" 
--   ON public.contact_messages 
--   FOR INSERT 
--   WITH CHECK (true);
