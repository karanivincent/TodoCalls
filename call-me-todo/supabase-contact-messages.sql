-- Create contact_messages table to store form submissions
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'unread', -- unread, read, replied
  replied_at TIMESTAMPTZ,
  notes TEXT
);

-- Add RLS policies
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (for contact form)
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can read messages (for admin)
CREATE POLICY "Authenticated users can read contact messages" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (true);

-- Only authenticated users can update messages (for marking as read/replied)
CREATE POLICY "Authenticated users can update contact messages" ON public.contact_messages
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);