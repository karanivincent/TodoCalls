-- Migration to support multiple phone numbers per user
-- Run this in your Supabase SQL Editor

-- Create phone_numbers table for multiple numbers per user
CREATE TABLE IF NOT EXISTS public.phone_numbers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    phone_number TEXT NOT NULL,
    label TEXT, -- e.g., "Mobile", "Work", "Home"
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, phone_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_phone_numbers_user_id ON public.phone_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_primary ON public.phone_numbers(user_id, is_primary);

-- Enable Row Level Security
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

-- RLS policies for phone_numbers
CREATE POLICY "Users can view own phone numbers" ON public.phone_numbers
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own phone numbers" ON public.phone_numbers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phone numbers" ON public.phone_numbers
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own phone numbers" ON public.phone_numbers
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to ensure only one primary phone per user
CREATE OR REPLACE FUNCTION ensure_single_primary_phone()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE public.phone_numbers
        SET is_primary = false
        WHERE user_id = NEW.user_id 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary phone constraint
DROP TRIGGER IF EXISTS ensure_single_primary_phone_trigger ON public.phone_numbers;
CREATE TRIGGER ensure_single_primary_phone_trigger
    BEFORE INSERT OR UPDATE OF is_primary ON public.phone_numbers
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_phone();

-- Migrate existing phone numbers from user_profiles if they exist
INSERT INTO public.phone_numbers (user_id, phone_number, is_primary, is_verified)
SELECT id, phone_number, true, true
FROM public.user_profiles
WHERE phone_number IS NOT NULL
ON CONFLICT (user_id, phone_number) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.phone_numbers TO authenticated;