# 🚨 URGENT: Fix Supabase Email Links

Your magic link emails are STILL redirecting to localhost:3000. You MUST update this in Supabase Dashboard NOW.

## Quick Fix Steps:

### 1. Go to Supabase Dashboard
**Direct link:** https://supabase.com/dashboard/project/sjcnyewjhbojwopsdbjc/auth/url-configuration

### 2. Update These Settings IMMEDIATELY:

#### Site URL (MUST CHANGE):
```
https://telitask.com
```

#### Redirect URLs (REPLACE ALL with these):
```
https://telitask.com
https://telitask.com/**
https://telitask.com/dashboard
https://telitask.com/auth/callback
http://localhost:5173
http://localhost:5173/**
```

### 3. REMOVE These URLs:
- `http://localhost:3000` (DELETE THIS)
- Any other localhost:3000 entries

### 4. Click "Save" at the bottom

## Verify It Worked:
1. Go to https://telitask.com/auth
2. Request a new magic link
3. Check that the email link contains `redirect_to=https://telitask.com` NOT localhost

## Why This Happens:
Supabase stores the redirect URLs in your project settings. Even though we updated the code, Supabase's dashboard settings override everything. You MUST change it in the dashboard.

## Alternative: Update via Supabase CLI
If you have Supabase CLI access, you can also run:
```bash
supabase --project-ref sjcnyewjhbojwopsdbjc auth set --site-url https://telitask.com
```