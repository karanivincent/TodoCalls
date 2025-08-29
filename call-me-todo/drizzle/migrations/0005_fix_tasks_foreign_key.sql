-- Fix tasks foreign key to reference auth.users instead of user_profiles
-- The user_id should reference auth.users(id) directly

-- First, drop the existing foreign key constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

-- Add the correct foreign key constraint to auth.users
ALTER TABLE tasks 
ADD CONSTRAINT tasks_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Verify the user exists and has the correct phone number set as primary
SELECT 
  au.id as auth_user_id,
  au.email,
  pn.phone_number,
  pn.is_whatsapp_primary
FROM auth.users au
LEFT JOIN phone_numbers pn ON pn.user_id = au.id
WHERE au.email = 'trevorvinnie@gmail.com'
  OR pn.phone_number = '+254704985136';

-- Make sure the phone number is set as WhatsApp primary for the correct user
UPDATE phone_numbers 
SET is_whatsapp_primary = true
WHERE phone_number = '+254704985136'
  AND user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'trevorvinnie@gmail.com'
  );