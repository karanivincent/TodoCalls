-- Add consent fields to user_profiles table
-- This migration adds marketing_consent and accepted_terms_at fields

-- Add marketing_consent column if it doesn't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;

-- Add accepted_terms_at column if it doesn't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ;

-- Add privacy_policy_accepted_at column for tracking privacy policy acceptance separately
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMPTZ;

-- Add email_verified_at column to track when email was verified
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Create an index on marketing_consent for faster queries when filtering marketing recipients
CREATE INDEX IF NOT EXISTS idx_user_profiles_marketing_consent 
ON public.user_profiles(marketing_consent) 
WHERE marketing_consent = true;

-- Create a function to update user profile with consent data after signup
CREATE OR REPLACE FUNCTION public.handle_new_user_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user profile with consent data from auth metadata
  UPDATE public.user_profiles
  SET 
    marketing_consent = COALESCE(
      (NEW.raw_user_meta_data->>'marketing_consent')::boolean, 
      false
    ),
    accepted_terms_at = CASE 
      WHEN NEW.raw_user_meta_data->>'terms_accepted' = 'true' 
      THEN NOW() 
      ELSE NULL 
    END,
    privacy_policy_accepted_at = CASE 
      WHEN NEW.raw_user_meta_data->>'terms_accepted' = 'true' 
      THEN NOW() 
      ELSE NULL 
    END,
    email_verified_at = NEW.email_confirmed_at
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after user signup/update
DROP TRIGGER IF EXISTS on_auth_user_consent_update ON auth.users;
CREATE TRIGGER on_auth_user_consent_update
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_consent();

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN public.user_profiles.marketing_consent IS 'User consent for marketing emails';
COMMENT ON COLUMN public.user_profiles.accepted_terms_at IS 'Timestamp when user accepted terms of service';
COMMENT ON COLUMN public.user_profiles.privacy_policy_accepted_at IS 'Timestamp when user accepted privacy policy';
COMMENT ON COLUMN public.user_profiles.email_verified_at IS 'Timestamp when user verified their email address';

-- Create a view for marketing-eligible users (opted in and email verified)
CREATE OR REPLACE VIEW public.marketing_eligible_users AS
SELECT 
  up.id,
  up.phone_number,
  au.email,
  up.created_at,
  up.marketing_consent,
  up.email_verified_at
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE 
  up.marketing_consent = true 
  AND up.email_verified_at IS NOT NULL
  AND au.deleted_at IS NULL;

-- Grant appropriate permissions
GRANT SELECT ON public.marketing_eligible_users TO authenticated;

-- Example query to get all users who consented to marketing
-- SELECT * FROM public.marketing_eligible_users;

-- Example query to update marketing consent for a user
-- UPDATE public.user_profiles 
-- SET marketing_consent = false 
-- WHERE id = 'user-uuid-here';