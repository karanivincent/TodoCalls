#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Supabase Keys Configuration\n');
console.log('URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Anon Key:', supabaseAnonKey ? '✅ Found' : '❌ Missing');
console.log('Service Key:', supabaseServiceKey ? '✅ Found' : '❌ Missing');
console.log('');

if (!supabaseServiceKey) {
  console.log('⚠️  Service Role Key is missing!');
  console.log('');
  console.log('To fix:');
  console.log('1. Go to: https://supabase.com/dashboard/project/sjcnyewjhbojwopsdbjc/settings/api');
  console.log('2. Copy the "service_role" key (secret)');
  console.log('3. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.log('4. Add to Vercel: vercel env add SUPABASE_SERVICE_ROLE_KEY production');
  process.exit(1);
}

// Test with anon key (respects RLS)
console.log('Testing with ANON key (respects RLS):');
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

// Try to create a task with anon key
const { data: anonTask, error: anonError } = await anonClient
  .from('tasks')
  .insert({
    user_id: 'test-user-id',
    title: 'Test task from anon',
    phone_number: '+254704985136',
    scheduled_at: new Date().toISOString(),
    source: 'whatsapp'
  })
  .select()
  .single();

if (anonError) {
  console.log('❌ Anon key failed (expected):', anonError.message);
} else {
  console.log('✅ Anon key succeeded (unexpected)');
}

console.log('');

// Test with service role key (bypasses RLS)
console.log('Testing with SERVICE ROLE key (bypasses RLS):');
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

const { data: serviceTask, error: serviceError } = await serviceClient
  .from('tasks')
  .insert({
    user_id: 'test-user-id',
    title: 'Test task from service role',
    phone_number: '+254704985136',
    scheduled_at: new Date().toISOString(),
    source: 'whatsapp'
  })
  .select()
  .single();

if (serviceError) {
  console.log('❌ Service role key failed:', serviceError.message);
} else {
  console.log('✅ Service role key succeeded!');
  console.log('Task created:', serviceTask.id);
  
  // Clean up test task
  await serviceClient
    .from('tasks')
    .delete()
    .eq('id', serviceTask.id);
  console.log('🧹 Test task cleaned up');
}

console.log('');
console.log('Summary:');
console.log('- If service role succeeds, the key is configured correctly');
console.log('- You need to add this key to Vercel for WhatsApp to work');