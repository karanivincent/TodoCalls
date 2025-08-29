-- Clear WhatsApp session to force refresh with new user data
-- Run this in Supabase SQL Editor

-- Clear session for your phone number
DELETE FROM whatsapp_sessions 
WHERE phone_number = '+254704985136';

-- Verify it's deleted
SELECT * FROM whatsapp_sessions 
WHERE phone_number = '+254704985136';

-- Check if your phone number is set as WhatsApp primary
SELECT 
  pn.*,
  au.email
FROM phone_numbers pn
JOIN auth.users au ON au.id = pn.user_id
WHERE pn.phone_number = '+254704985136'
  AND pn.is_whatsapp_primary = true;