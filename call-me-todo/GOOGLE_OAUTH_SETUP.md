# Google OAuth Setup - Minimize Consent Screen

## Issue
You're seeing two screens when signing in with Google:
1. Account selection screen
2. Consent/permission screen

## Solution

### 1. Code Changes (Already Applied)
- Changed `prompt: 'consent'` to `prompt: 'select_account'` in the OAuth parameters
- This will only show the account picker, not the full consent screen for returning users

### 2. Supabase Dashboard Configuration
Go to your Supabase project settings:
1. Navigate to Authentication > Providers > Google
2. Ensure these URLs are set:
   - Site URL: `https://telitask.com` (or your production URL)
   - Redirect URLs should include:
     - `https://telitask.com/auth/callback`
     - `https://your-vercel-app.vercel.app/auth/callback`

### 3. Google Cloud Console Configuration
To completely minimize the consent screen:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to "APIs & Services" > "OAuth consent screen"
4. Make sure your app is set to:
   - **Publishing status**: Published (not Testing)
   - **User type**: External
   
5. Under "OAuth consent screen" configuration:
   - Add your production domain to "Authorized domains"
   - Keep scopes minimal (only email and profile)

6. Go to "Credentials" > Your OAuth 2.0 Client ID:
   - Add to "Authorized JavaScript origins":
     - `https://telitask.com`
     - `https://your-project.supabase.co`
   - Add to "Authorized redirect URIs":
     - `https://your-project.supabase.co/auth/v1/callback`

### 4. Why You Still See Two Screens
The second screen only appears when:
- First time users sign in (they must consent once)
- You're in "Testing" mode in Google Console
- The user hasn't previously consented to your app
- You're requesting new scopes

For returning users with a "Published" app, they should only see the account selector.

## Testing the Fix
1. Sign out completely
2. Clear your browser cookies for accounts.google.com
3. Try signing in again
4. Returning users should only see the account picker

## Dashboard Redirect
The callback page has been updated to:
- Properly handle OAuth codes
- Always redirect Google sign-ins to `/dashboard`
- Handle email confirmations separately