-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can read contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can update contact messages" ON public.contact_messages;

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'unread',
  replied_at TIMESTAMPTZ,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert contact messages" 
  ON public.contact_messages 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read contact messages" 
  ON public.contact_messages 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update contact messages" 
  ON public.contact_messages 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at 
  ON public.contact_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status 
  ON public.contact_messages(status);