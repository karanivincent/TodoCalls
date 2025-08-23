-- Simple migration to bypass verification for existing users
-- Run this in Supabase SQL Editor

-- First, check what phone numbers exist in user_profiles
SELECT 'User profiles with phone numbers:' as info;
SELECT 
  id as user_id,
  phone_number,
  created_at
FROM user_profiles 
WHERE phone_number IS NOT NULL 
  AND phone_number != '';

-- Check if phone_numbers table has any data
SELECT 'Existing phone_numbers table data:' as info;
SELECT * FROM phone_numbers;

-- Insert your phone number directly as verified
-- Replace 'YOUR_USER_ID' with your actual user ID from the first query above
INSERT INTO phone_numbers (
  user_id, 
  phone_number, 
  label, 
  is_primary, 
  is_verified
)
SELECT 
  id as user_id,
  phone_number,
  'Primary' as label,
  true as is_primary,
  true as is_verified  -- This bypasses verification!
FROM user_profiles 
WHERE phone_number = '+254704985136'
  AND id NOT IN (SELECT COALESCE(user_id, '00000000-0000-0000-0000-000000000000') FROM phone_numbers)
ON CONFLICT (user_id, phone_number) 
DO UPDATE SET is_verified = true, is_primary = true;

-- Verify the result
SELECT 'Final result:' as info;
SELECT 
  user_id,
  phone_number,
  label,
  is_primary,
  is_verified,
  created_at
FROM phone_numbers 
WHERE phone_number = '+254704985136';