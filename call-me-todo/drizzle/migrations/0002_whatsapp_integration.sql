-- WhatsApp Integration Migration
-- This migration adds support for WhatsApp Business API integration

-- Core WhatsApp sessions table
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_status TEXT DEFAULT 'active' CHECK (session_status IN ('active', 'inactive', 'expired')),
  session_type TEXT DEFAULT 'guest' CHECK (session_type IN ('guest', 'registered', 'premium')),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  context JSONB DEFAULT '{}',
  conversation_state TEXT DEFAULT 'idle',
  pending_action JSONB,
  temp_task_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Index for faster lookups
CREATE INDEX idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number);
CREATE INDEX idx_whatsapp_sessions_user ON whatsapp_sessions(user_id);
CREATE INDEX idx_whatsapp_sessions_expires ON whatsapp_sessions(expires_at);

-- WhatsApp media storage table
CREATE TABLE IF NOT EXISTS whatsapp_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'document', 'audio', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  original_filename TEXT,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Extracted data from OCR/AI processing
  extracted_text TEXT,
  extracted_data JSONB,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  
  -- Task associations
  related_task_ids UUID[] DEFAULT '{}',
  
  -- Categorization
  tags TEXT[] DEFAULT '{}',
  category TEXT CHECK (category IN ('receipt', 'document', 'note', 'business_card', 'screenshot', 'whiteboard', 'other')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes for media table
CREATE INDEX idx_whatsapp_media_user ON whatsapp_media(user_id);
CREATE INDEX idx_whatsapp_media_phone ON whatsapp_media(phone_number);
CREATE INDEX idx_whatsapp_media_category ON whatsapp_media(category);
CREATE INDEX idx_whatsapp_media_status ON whatsapp_media(processing_status);
CREATE INDEX idx_whatsapp_media_created ON whatsapp_media(created_at DESC);

-- WhatsApp message templates for approved messages
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  template_id TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  category TEXT NOT NULL CHECK (category IN ('utility', 'marketing', 'authentication')),
  header_text TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  variables JSONB DEFAULT '[]',
  buttons JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp conversation logs for analytics
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('inbound', 'outbound')),
  message_format TEXT CHECK (message_format IN ('text', 'image', 'audio', 'document', 'template', 'interactive')),
  message_content TEXT,
  media_id UUID REFERENCES whatsapp_media(id),
  template_id UUID REFERENCES whatsapp_templates(id),
  
  -- AI processing
  intent TEXT,
  confidence_score DECIMAL(3,2),
  extracted_entities JSONB,
  
  -- Status tracking
  delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX idx_whatsapp_conversations_session ON whatsapp_conversations(session_id);
CREATE INDEX idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX idx_whatsapp_conversations_created ON whatsapp_conversations(created_at DESC);

-- Update tasks table to support WhatsApp media attachments
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS media_ids UUID[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web' CHECK (source IN ('web', 'whatsapp', 'api', 'voice'));

-- Update user_profiles for WhatsApp preferences
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS whatsapp_opted_in BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_channel TEXT DEFAULT 'phone' CHECK (preferred_channel IN ('phone', 'whatsapp', 'sms', 'email'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS media_storage_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS auto_ocr_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS whatsapp_notification_enabled BOOLEAN DEFAULT TRUE;

-- Create index for WhatsApp number lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_whatsapp ON user_profiles(whatsapp_number);

-- Function to auto-expire guest sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS void AS $$
BEGIN
  -- Delete expired guest sessions
  DELETE FROM whatsapp_sessions 
  WHERE session_type = 'guest' 
  AND expires_at < NOW();
  
  -- Delete associated media for expired sessions
  DELETE FROM whatsapp_media 
  WHERE phone_number IN (
    SELECT phone_number FROM whatsapp_sessions 
    WHERE session_type = 'guest' 
    AND expires_at < NOW()
  )
  AND user_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update last_interaction on message
CREATE OR REPLACE FUNCTION update_session_interaction() RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_sessions 
  SET last_interaction = NOW() 
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_interaction_time
AFTER INSERT ON whatsapp_conversations
FOR EACH ROW
EXECUTE FUNCTION update_session_interaction();

-- Add some default WhatsApp templates
INSERT INTO whatsapp_templates (template_name, template_id, category, body_text, variables) VALUES
('task_reminder', 'task_reminder_1', 'utility', 'Hi {{1}}, this is your reminder for: {{2}} scheduled at {{3}}', '["user_name", "task_title", "scheduled_time"]'),
('daily_summary', 'daily_summary_1', 'utility', 'Good morning {{1}}! You have {{2}} tasks today. Your first task is at {{3}}.', '["user_name", "task_count", "first_task_time"]'),
('welcome_message', 'welcome_1', 'utility', 'Welcome to TeliTask! I''m your AI assistant. Send me any task, photo, or voice note to get started.', '[]')
ON CONFLICT (template_name) DO NOTHING;