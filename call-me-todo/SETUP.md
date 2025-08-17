# Call-Me Todo Setup Guide

## Overview
Call-Me Todo is an AI-powered task management app that uses conversational AI to help users manage tasks through phone calls. Users can speak naturally with an AI assistant to create, update, complete, or snooze tasks.

## Architecture
- **Frontend**: SvelteKit with Tailwind CSS
- **Database**: Supabase (PostgreSQL with Auth)
- **Voice**: Twilio + OpenAI Realtime API
- **AI**: OpenAI GPT-4 with function calling

## Prerequisites

1. **Supabase Account** - [supabase.com](https://supabase.com)
2. **Twilio Account** - [twilio.com](https://twilio.com)
3. **OpenAI API Key** - [platform.openai.com](https://platform.openai.com)
4. **Node.js 18+**
5. **ngrok** (for local testing)

## Step 1: Database Setup

1. Create a new Supabase project
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Enable Email authentication in Authentication > Providers
4. Copy your project URL and anon key from Settings > API

## Step 2: Environment Configuration

1. Copy `.env.example` to `.env`
2. Add your credentials:

```env
# Supabase (from your Supabase project)
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Twilio (from your Twilio account)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Need to add
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Get service key from Supabase for server-side operations
SUPABASE_SERVICE_KEY=your_service_key_here

# For production
WEBHOOK_BASE_URL=https://your-domain.com
CRON_SECRET=your_cron_secret_here
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Configure Twilio

1. **Set up ngrok for local development:**
   ```bash
   ngrok http 5050
   ```

2. **Configure Twilio phone number:**
   - Go to Twilio Console > Phone Numbers
   - Click on your phone number (+17744316453)
   - Set the Voice webhook to: `https://your-ngrok-url.ngrok.io/incoming-call`
   - Method: POST
   - Save

## Step 5: Run the Application

**Terminal 1 - Voice Server:**
```bash
npm run voice-server
```

**Terminal 2 - Web App:**
```bash
npm run dev
```

Or run both:
```bash
npm run dev:all
```

## Step 6: Test the Application

1. **Sign Up:**
   - Go to http://localhost:5173
   - Click "Get Started"
   - Enter your email
   - Check email for magic link

2. **Set Your Phone Number:**
   - In the dashboard, enter your phone number (with country code)
   - Click "Save"

3. **Test AI Assistant:**
   - Click "Test Call"
   - You'll receive a call from the AI assistant
   - Try these commands:
     - "Create a task to call mom tomorrow at 3 PM"
     - "What are my upcoming tasks?"
     - "Complete my first task"
     - "Snooze the task for 30 minutes"

4. **Create Tasks via Web:**
   - Click "New Task"
   - Enter task details
   - Set a time (must be in the future)
   - Save

## How the AI Assistant Works

### Conversation Flow
1. User receives a call (test call or scheduled reminder)
2. AI introduces itself and asks how it can help
3. User speaks naturally about what they want
4. AI uses function calling to:
   - Create tasks
   - List tasks
   - Complete tasks
   - Snooze tasks
5. AI confirms the action and asks if there's anything else

### Available Voice Commands
- **Create**: "Create a task to [description] at [time]"
- **List**: "What are my tasks?" / "Show me my upcoming tasks"
- **Complete**: "Mark my task as done" / "Complete the task about [description]"
- **Snooze**: "Snooze my task for 10 minutes" / "Postpone the reminder"

## Production Deployment

### Deploy to Vercel

1. **Push to GitHub**
2. **Connect to Vercel:**
   - Import your GitHub repo
   - Add environment variables
   - Deploy

3. **Deploy Voice Server:**
   - Use a service like Railway, Fly.io, or Heroku
   - Set WEBHOOK_BASE_URL to your deployed voice server URL

### Set up Cron Jobs

**Option 1: Supabase Edge Functions**
```sql
-- Create edge function to call your API every minute
SELECT cron.schedule(
  'check-due-tasks',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    'https://your-app.vercel.app/api/cron/check-tasks',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET'),
    body := '{}'::jsonb
  );
  $$
);
```

**Option 2: External Cron Service**
- Use cron-job.org or similar
- Set to POST to `/api/cron/check-tasks` every minute

## Troubleshooting

### Common Issues

1. **"Cannot connect to OpenAI"**
   - Check your OpenAI API key
   - Ensure you have access to Realtime API

2. **"Twilio webhook not receiving calls"**
   - Verify ngrok is running
   - Check Twilio phone number configuration
   - Look at Twilio debugger for errors

3. **"Tasks not being called"**
   - Check cron job is running
   - Verify task scheduled_at is in the correct timezone
   - Check Twilio call logs

4. **"User not found" errors**
   - Ensure user_profiles table has phone number
   - Check phone number format matches

### Debug Mode

Add these to your .env for detailed logging:
```env
DEBUG=true
LOG_LEVEL=verbose
```

## Security Considerations

1. **Never commit .env file**
2. **Use RLS policies in Supabase**
3. **Validate phone numbers before calling**
4. **Rate limit API endpoints**
5. **Use HTTPS in production**
6. **Rotate API keys regularly**

## Cost Optimization

- **Twilio**: ~$0.013 per minute for calls
- **OpenAI**: ~$0.15 per minute for Realtime API
- **Supabase**: Free tier includes 500MB database
- **Recommendation**: Set daily/monthly limits in production

## Next Steps

1. Add SMS fallback for missed calls
2. Implement call recordings
3. Add multi-language support
4. Create mobile app
5. Add team/organization features

## Support

For issues or questions:
- Check the logs in both terminals
- Review Twilio debugger
- Check Supabase logs
- Verify all environment variables are set correctly