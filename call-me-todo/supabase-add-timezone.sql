-- Add timezone column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Nairobi';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(id);

-- Update existing records to have default timezone
UPDATE user_profiles 
SET timezone = 'Africa/Nairobi' 
WHERE timezone IS NULL;