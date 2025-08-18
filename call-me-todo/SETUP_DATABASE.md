# 🚨 Database Setup Required

The error "Could not find the table 'public.user_profiles' in the schema cache" means your Supabase database tables haven't been created yet.

## Quick Setup (Do this NOW):

### 1. Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/sjcnyewjhbojwopsdbjc/sql/new

### 2. Copy and Run the SQL
Copy the entire contents of `supabase-setup.sql` and paste it into the SQL editor.

### 3. Click "Run"
This will create:
- `user_profiles` table for storing phone numbers
- `tasks` table for storing todos
- All necessary security policies
- Indexes for performance

### 4. Verify
After running, you should see:
```
status
------
user_profiles table created
tasks table created
```

### 5. Test Your App
Go back to https://telitask.com/dashboard and try saving your phone number again.

## Troubleshooting

If you get permission errors:
1. Make sure you're using the SQL editor in your Supabase dashboard
2. Check that Row Level Security (RLS) is enabled
3. Verify you're logged in when testing the app

## Alternative: Run via Supabase CLI
If you have Supabase CLI installed:
```bash
supabase db reset --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.sjcnyewjhbojwopsdbjc.supabase.co:5432/postgres"
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.sjcnyewjhbojwopsdbjc.supabase.co:5432/postgres" < supabase-setup.sql
```