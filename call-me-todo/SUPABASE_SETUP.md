# URGENT: Supabase Configuration Required

## The Problem
Your magic link emails are redirecting to `localhost:3000` instead of your production URL.

## Fix This Now in Supabase Dashboard

### 1. Go to Supabase Dashboard
https://supabase.com/dashboard/project/sjcnyewjhbojwopsdbjc

### 2. Update Authentication Settings
Navigate to: **Authentication** → **URL Configuration**

Set these values:

**Site URL:**
```
https://call-me-todo-aucskr4i6-karanivincents-projects.vercel.app
```

**Redirect URLs** (add ALL of these):
```
https://call-me-todo-aucskr4i6-karanivincents-projects.vercel.app/**
https://call-me-todo-aucskr4i6-karanivincents-projects.vercel.app/dashboard
https://call-me-todo-aucskr4i6-karanivincents-projects.vercel.app/auth/callback
http://localhost:5173/**
http://localhost:5173/dashboard
http://localhost:5173/auth/callback
```

### 3. Save Changes
Click "Save" at the bottom of the page.

### 4. Test Again
After saving, request a new magic link and it should redirect to the production URL.

## Why This Happens
Supabase uses the Site URL and Redirect URLs configured in your project settings to determine where to send users after authentication. The default is localhost, which is why you're seeing `localhost:3000` in your magic link.

## Alternative Quick Fix (if dashboard access is limited)
You can also update this via Supabase CLI or API, but the dashboard is the easiest method.