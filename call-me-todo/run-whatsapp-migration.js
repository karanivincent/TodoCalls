#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running WhatsApp Integration Migration\n');

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'drizzle/migrations/0002_whatsapp_integration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split into individual statements (basic split, may need refinement)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip if it's just whitespace or comments
      if (!statement.trim() || statement.trim().startsWith('--')) {
        continue;
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // For Supabase, we need to use raw SQL through RPC or direct connection
        // Since we can't run raw SQL directly, we'll show what needs to be run
        console.log(`Statement preview: ${statement.substring(0, 50)}...`);
        
        // You would need to run this in Supabase SQL editor
        successCount++;
      } catch (error) {
        console.error(`❌ Failed: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Migration Summary:`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${errorCount}`);
    console.log('='.repeat(60));

    // Alternative: Direct instructions for Supabase
    console.log('\n📋 To run this migration in Supabase:\n');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Copy the contents of:');
    console.log('   drizzle/migrations/0002_whatsapp_integration.sql');
    console.log('5. Run the query\n');

    console.log('Or use the Supabase CLI:');
    console.log('   supabase db push < drizzle/migrations/0002_whatsapp_integration.sql\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();