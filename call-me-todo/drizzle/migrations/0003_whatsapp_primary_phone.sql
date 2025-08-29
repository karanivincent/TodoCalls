-- Migration to add WhatsApp primary phone number handling
-- This ensures only one user can have a phone number as primary for WhatsApp

-- Add whatsapp_primary column to phone_numbers table
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS is_whatsapp_primary BOOLEAN DEFAULT false;

-- Create unique partial index to ensure only one user can have a number as WhatsApp primary
CREATE UNIQUE INDEX idx_unique_whatsapp_primary_phone 
ON phone_numbers(phone_number) 
WHERE is_whatsapp_primary = true;

-- Function to set a phone number as WhatsApp primary
CREATE OR REPLACE FUNCTION set_whatsapp_primary_phone(
  p_user_id UUID,
  p_phone_number TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- First, remove primary status from any other user who has this number as primary
  UPDATE phone_numbers 
  SET is_whatsapp_primary = false 
  WHERE phone_number = p_phone_number 
    AND is_whatsapp_primary = true
    AND user_id != p_user_id;

  -- Remove primary status from user's other numbers
  UPDATE phone_numbers 
  SET is_whatsapp_primary = false 
  WHERE user_id = p_user_id 
    AND is_whatsapp_primary = true
    AND phone_number != p_phone_number;

  -- Set this number as primary for this user
  UPDATE phone_numbers 
  SET is_whatsapp_primary = true,
      is_primary = true,
      updated_at = NOW()
  WHERE user_id = p_user_id 
    AND phone_number = p_phone_number;

  -- If the number doesn't exist for this user, insert it
  IF NOT FOUND THEN
    INSERT INTO phone_numbers (user_id, phone_number, is_primary, is_whatsapp_primary, is_verified)
    VALUES (p_user_id, p_phone_number, true, true, false);
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to find user by WhatsApp primary phone
CREATE OR REPLACE FUNCTION get_user_by_whatsapp_phone(
  p_phone_number TEXT
) RETURNS TABLE (
  user_id UUID,
  email TEXT,
  is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pn.user_id,
    au.email,
    pn.is_verified
  FROM phone_numbers pn
  JOIN auth.users au ON au.id = pn.user_id
  WHERE pn.phone_number = p_phone_number 
    AND pn.is_whatsapp_primary = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Update existing phone numbers if needed
-- Set primary numbers as WhatsApp primary where applicable
UPDATE phone_numbers 
SET is_whatsapp_primary = is_primary 
WHERE is_primary = true
  AND NOT EXISTS (
    SELECT 1 FROM phone_numbers pn2 
    WHERE pn2.phone_number = phone_numbers.phone_number 
    AND pn2.is_whatsapp_primary = true
  );

-- Add comment for clarity
COMMENT ON COLUMN phone_numbers.is_whatsapp_primary IS 'Indicates if this phone number receives WhatsApp messages for this user. Only one user can have a number as WhatsApp primary.';

-- Create a view for easy querying
CREATE OR REPLACE VIEW whatsapp_user_lookup AS
SELECT 
  pn.phone_number,
  pn.user_id,
  au.email,
  pn.is_verified,
  up.id as profile_id
FROM phone_numbers pn
JOIN auth.users au ON au.id = pn.user_id
LEFT JOIN user_profiles up ON up.id = pn.user_id
WHERE pn.is_whatsapp_primary = true;