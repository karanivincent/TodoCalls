# 🚨 IMPORTANT: Run WhatsApp Database Migration

The WhatsApp webhook is failing because the database tables don't exist yet. You need to run the migration in Supabase.

## Quick Steps:

1. **Open Supabase SQL Editor:**
   https://supabase.com/dashboard/project/sjcnyewjhbojwopsdbjc/sql

2. **Create a new query**

3. **Copy the ENTIRE contents of this file:**
   `drizzle/migrations/0002_whatsapp_integration.sql`

4. **Paste and run the query**

5. **Verify tables were created:**
   - whatsapp_sessions
   - whatsapp_media
   - whatsapp_templates
   - whatsapp_conversations

## After Migration:

Once the tables are created, your WhatsApp integration will work!

Test by sending "Hi" to **+1 555 193 2671** on WhatsApp.

You should receive a welcome message back.