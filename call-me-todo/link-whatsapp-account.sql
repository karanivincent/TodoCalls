-- SQL to link your WhatsApp number to your account
-- Run this in Supabase SQL Editor

-- First, let's see your user account
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'trevorvinnie@gmail.com';

-- Then update your user profile with WhatsApp number
-- Replace YOUR_USER_ID with the ID from above query
UPDATE user_profiles 
SET whatsapp_number = '+254704985136'
WHERE id = 'YOUR_USER_ID';

-- Or if user_profiles doesn't have whatsapp_number column yet, add it:
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT UNIQUE;

-- Then update your profile
UPDATE user_profiles 
SET whatsapp_number = '+254704985136'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'trevorvinnie@gmail.com'
);

-- Verify the link
SELECT u.email, up.whatsapp_number 
FROM auth.users u
JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'trevorvinnie@gmail.com';