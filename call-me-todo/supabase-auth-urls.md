# Supabase Authentication URLs Configuration

## Important: Update Your Supabase Project Settings

You need to update your Supabase project's authentication settings to use the production URL.

### Steps to Configure:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Update the following settings:

### Site URL:
```
https://telitask.com
```

### Redirect URLs (add all of these):
```
https://telitask.com/dashboard
https://telitask.com/auth/callback
http://localhost:5173/dashboard
http://localhost:5173/auth/callback
```

### Email Templates:
In **Authentication** → **Email Templates** → **Magic Link**, ensure the URL is:
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink
```

## Alternative: Environment-based Redirect

If you want to handle this programmatically, update the auth page to use an environment variable: