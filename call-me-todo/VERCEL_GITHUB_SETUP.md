# Connect GitHub to Vercel for Automatic Deployments

## Steps to Connect:

### 1. Go to Vercel Dashboard
https://vercel.com/dashboard

### 2. Import Git Repository
- Click **"Add New..."** → **"Project"**
- Select **"Import Git Repository"**

### 3. Connect GitHub
- Click **"Continue with GitHub"**
- Authorize Vercel to access your GitHub account if not already done
- Search for **"TodoCalls"** repository
- Click **"Import"**

### 4. Configure Project Settings

**Project Name:** `call-me-todo`

**Framework Preset:** SvelteKit (should auto-detect)

**Root Directory:** `call-me-todo` (IMPORTANT: Set this since your project is in a subdirectory)

**Build Settings:**
- Build Command: `npm run build` (or leave as default)
- Output Directory: `.svelte-kit` (or leave as default)
- Install Command: `npm install` (or leave as default)

### 5. Environment Variables
Add all your environment variables:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+17744316453
OPENAI_API_KEY=your_openai_key
PUBLIC_SUPABASE_URL=https://sjcnyewjhbojwopsdbjc.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

### 6. Deploy
Click **"Deploy"**

## After Setup:
- Every push to `main` branch will trigger automatic deployment
- Pull requests will get preview deployments
- You'll get a permanent URL like: `call-me-todo.vercel.app`

## Benefits:
- Automatic deployments on git push
- Preview deployments for PRs
- Better domain name (not the long auto-generated one)
- Deployment logs and monitoring
- Rollback capabilities

## Custom Domain (Optional):
Once connected, you can add a custom domain in Vercel project settings.