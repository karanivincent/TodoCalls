# 🔑 IMPORTANT: Add Supabase Service Role Key

The WhatsApp integration needs the Supabase service role key to bypass RLS and create tasks.

## Steps to Add Service Role Key:

### 1. Get the Service Role Key from Supabase:
1. Go to: https://supabase.com/dashboard/project/sjcnyewjhbojwopsdbjc/settings/api
2. Find **Service role key** (secret)
3. Copy the entire key

### 2. Add to Local .env:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Add to Vercel:
```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```
Then paste the key when prompted

Or manually:
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add new variable: `SUPABASE_SERVICE_ROLE_KEY`
3. Paste the service role key
4. Save and redeploy

## After Adding the Key:

1. Clear your WhatsApp session (run the SQL in `clear-whatsapp-session.sql`)
2. Send a new message to the WhatsApp bot
3. It should now:
   - Know who you are
   - Be able to create tasks
   - Be able to list your tasks

## Security Note:
⚠️ The service role key bypasses all RLS policies. Never expose it in client-side code or commit it to Git!