# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TeliTask (formerly Call Me Todo) is a SvelteKit application that sends phone call reminders for tasks using Twilio and OpenAI APIs. The app allows users to schedule tasks and receive automated phone calls at specified times.

## Development Commands

```bash
# Development
npm run dev              # Start development server (http://localhost:5173)
npm run dev:all          # Start both dev server and voice server concurrently
npm run voice-server     # Start voice server separately (for local Twilio testing)

# Build & Deploy  
npm run build            # Build for production
npm run preview          # Preview production build locally
vercel --prod            # Deploy to Vercel production
vercel                   # Deploy to Vercel preview

# Type Checking & Validation
npm run check            # Run svelte-check once
npm run check:watch      # Run svelte-check in watch mode
```

## Architecture

### Tech Stack
- **Frontend**: SvelteKit 2 + Svelte 5 + TypeScript + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Voice Calls**: Twilio API + OpenAI TTS API
- **Email**: Resend API for contact form notifications
- **Deployment**: Vercel with adapter-vercel
- **Payments**: Not yet implemented (planned)

### Database Schema (Supabase)
Key tables with RLS (Row Level Security) enabled:
- `user_profiles`: Stores user phone numbers
- `tasks`: User tasks with scheduled times and status
- `phone_numbers`: User phone numbers with verification status
- `contact_messages`: Contact form submissions (RLS disabled for public access)

### API Endpoints

#### Voice Endpoints (Twilio Webhooks - Public)
- `/api/voice/incoming.js` - Handles incoming calls with TwiML
- `/api/voice/test-call.js` - Initiates test calls with Say verb
- `/api/voice/test-call-audio.js` - Test calls with OpenAI TTS audio
- `/api/voice/test-call-personalized.js` - Personalized test calls
- `/api/voice/status.js` - Call status webhook handler

#### Application Endpoints (Protected)
- `/api/call` - Initiates reminder calls (requires auth)
- `/api/contact` - Handles contact form submissions
- `/api/cron/check-tasks` - Cron job to check and trigger scheduled tasks

### Authentication Flow
- Supabase Auth with email/password
- Auth state managed in `src/lib/supabase.ts`
- Protected routes check for auth session
- Public voice endpoints bypass auth via `hooks.server.ts`

## Environment Variables

Required in Vercel/production:
```
PUBLIC_SUPABASE_URL          # Supabase project URL
PUBLIC_SUPABASE_ANON_KEY     # Supabase anonymous key
TWILIO_ACCOUNT_SID           # Twilio account credentials
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER          # Format: +1234567890
OPENAI_API_KEY               # For TTS API
RESEND_API_KEY               # For email notifications
```

## Important Considerations

### Twilio Webhook Configuration
- Voice endpoints in `/api/voice/` must be publicly accessible
- CORS headers configured in `vercel.json` and `hooks.server.ts`
- Webhooks return TwiML (XML) responses
- Status callbacks use POST method

### Voice Call Implementation
Two approaches for voice generation:
1. **Twilio Say** verb - Simple but robotic (`test-call.js`)
2. **OpenAI TTS** - Natural voice, streams audio URL (`test-call-audio.js`)

### Deployment Notes
- Build before deploying: `npm run build && vercel --prod`
- Vercel functions have 10-second timeout (configured in vercel.json)
- Voice endpoints are serverless functions, not SvelteKit routes
- After significant changes, force deploy with `vercel --prod --force`

### Current Limitations
- No payment integration yet
- Voice server (`src/server/voice-server.js`) for local testing only
- Contact form requires manual domain verification in Resend for custom "from" addresses

## File Structure Highlights

```
/api/voice/              # Vercel serverless functions for Twilio
/src/routes/             # SvelteKit pages and API routes
/src/lib/                # Shared utilities and Supabase client
/src/hooks.server.ts     # Request handling and auth bypass for webhooks
/vercel.json            # Vercel configuration and rewrites
```

## Testing Voice Calls

1. Ensure environment variables are set in Vercel
2. Use `/dashboard` to create test reminders
3. Voice webhook URLs: `https://[your-domain]/api/voice/[endpoint]`
4. Test with curl or Twilio console
5. Check Vercel function logs for debugging