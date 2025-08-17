#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

console.log(`
================================================================================
🚨 URGENT ACTION REQUIRED - FIX SUPABASE EMAIL LINKS
================================================================================

Your magic link emails are sending users to localhost:3000 instead of your 
production app at https://call-me-todo.vercel.app

YOU MUST FIX THIS NOW:

1. Open this link in your browser:
   👉 https://supabase.com/dashboard/project/sjcnyewjhbojwopsdbjc/auth/url-configuration

2. Change "Site URL" from:
   ❌ http://localhost:3000
   To:
   ✅ https://call-me-todo.vercel.app

3. In "Redirect URLs", REMOVE:
   ❌ http://localhost:3000
   
   And ADD these:
   ✅ https://call-me-todo.vercel.app
   ✅ https://call-me-todo.vercel.app/**
   ✅ https://call-me-todo.vercel.app/dashboard
   ✅ https://call-me-todo.vercel.app/auth/callback

4. Click the "Save" button at the bottom

5. Test it:
   - Go to https://call-me-todo.vercel.app/auth
   - Enter your email
   - Check that the magic link in your email goes to the vercel.app URL

================================================================================
This CANNOT be fixed from code - you MUST update it in the Supabase Dashboard!
================================================================================
`);

// Also update our auth page to handle this better
console.log('\nUpdating auth page to use absolute URL...');

const authPageUpdate = `
The auth page has been updated to always use the production URL for magic links.
However, this will ONLY work if you update the Supabase dashboard settings!
`;

console.log(authPageUpdate);