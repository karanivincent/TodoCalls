-- Migration script to move existing phone numbers from user_profiles to phone_numbers table
-- Run this in your Supabase SQL Editor

-- First, let's see what phone numbers we need to migrate
SELECT 
  id as user_id,
  phone_number,
  created_at
FROM user_profiles 
WHERE phone_number IS NOT NULL 
  AND phone_number != '';

-- Insert existing phone numbers into phone_numbers table as verified and primary
INSERT INTO phone_numbers (
  user_id, 
  phone_number, 
  label, 
  is_primary, 
  is_verified,
  created_at
)
SELECT 
  id as user_id,
  phone_number,
  'Primary' as label,
  true as is_primary,
  true as is_verified,  -- Mark existing numbers as verified
  created_at
FROM user_profiles 
WHERE phone_number IS NOT NULL 
  AND phone_number != ''
  AND id NOT IN (
    -- Don't duplicate if already exists
    SELECT user_id FROM phone_numbers WHERE user_id = user_profiles.id
  );

-- Verify the migration worked
SELECT 
  pn.user_id,
  pn.phone_number,
  pn.label,
  pn.is_primary,
  pn.is_verified,
  up.phone_number as old_phone_number
FROM phone_numbers pn
LEFT JOIN user_profiles up ON pn.user_id = up.id
WHERE pn.is_verified = true;

-- Optional: Clean up old phone_number column (ONLY after confirming migration worked)
-- UPDATE user_profiles SET phone_number = NULL;