# Setting Up Resend for Email Notifications

## Quick Setup (5 minutes)

1. **Sign up for Resend** (free)
   - Go to https://resend.com
   - Sign up with your email
   - Verify your email address

2. **Get your API Key**
   - Once logged in, go to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)

3. **Add to Vercel**
   Run this command with your API key:
   ```bash
   echo "YOUR_RESEND_API_KEY" | vercel env add RESEND_API_KEY production
   ```
   
   Or manually:
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add `RESEND_API_KEY` with your key

4. **Redeploy**
   ```bash
   vercel --prod
   ```

## What This Gives You

- **100 free emails per day**
- Email notifications when someone submits the contact form
- Professional HTML emails
- Reply-to set to the sender's email

## Optional: Custom Domain

Later, you can verify your domain in Resend to send from:
- `noreply@telitask.com`
- `contact@telitask.com`

For now, it will send from `onboarding@resend.dev` which works perfectly fine.

## Alternative: Just Use Dashboard

If you don't want to set up email notifications, you can simply:
1. Check new messages at https://telitask.com/dashboard/contacts
2. Messages are stored in your database
3. You can mark them as read/replied