#!/usr/bin/env node

import twilio from 'twilio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio Sandbox number
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL || 'https://telitask.com';
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 WhatsApp Business API Setup for TeliTask\n');

// Validate environment variables
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.error('❌ Error: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in environment variables');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables');
  process.exit(1);
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupWhatsApp() {
  try {
    console.log('📱 Setting up WhatsApp integration...\n');

    // Step 1: Check if using sandbox or production number
    const isProduction = !TWILIO_WHATSAPP_NUMBER.includes('14155238886');
    
    if (!isProduction) {
      console.log('📦 Using Twilio WhatsApp Sandbox');
      console.log('   To connect your WhatsApp:');
      console.log('   1. Add +1 415 523 8886 to your contacts');
      console.log('   2. Send "join <your-sandbox-keyword>" to activate');
      console.log('   3. Your sandbox keyword will be provided in Twilio Console\n');
    } else {
      console.log('✅ Using production WhatsApp number:', TWILIO_WHATSAPP_NUMBER);
    }

    // Step 2: Configure webhook URLs
    console.log('🔗 Webhook URLs:');
    console.log(`   Incoming messages: ${WEBHOOK_BASE_URL}/api/whatsapp/webhook`);
    console.log(`   Status callbacks: ${WEBHOOK_BASE_URL}/api/whatsapp/status\n`);

    // Step 3: Test Twilio connection
    console.log('🔌 Testing Twilio connection...');
    const account = await client.api.accounts(TWILIO_ACCOUNT_SID).fetch();
    console.log(`   ✅ Connected to Twilio account: ${account.friendlyName}\n`);

    // Step 4: List available WhatsApp senders (if any)
    console.log('📋 Checking WhatsApp senders...');
    try {
      const senders = await client.messaging.services.list({ limit: 20 });
      
      if (senders.length > 0) {
        console.log(`   Found ${senders.length} messaging service(s):`);
        senders.forEach(service => {
          console.log(`   - ${service.friendlyName} (${service.sid})`);
        });
      } else {
        console.log('   No messaging services found. You may need to create one in Twilio Console.');
      }
    } catch (error) {
      console.log('   Could not list messaging services (this is normal for new accounts)');
    }

    // Step 5: Create default WhatsApp templates in database
    console.log('\n📝 Creating WhatsApp message templates...');
    
    const templates = [
      {
        template_name: 'task_reminder',
        template_id: 'task_reminder_1',
        category: 'utility',
        body_text: 'Hi {{1}}, this is your reminder for: {{2}} scheduled at {{3}}',
        variables: JSON.stringify(['user_name', 'task_title', 'scheduled_time']),
        status: 'pending'
      },
      {
        template_name: 'daily_summary',
        template_id: 'daily_summary_1',
        category: 'utility',
        body_text: 'Good morning {{1}}! You have {{2}} tasks today. Your first task is at {{3}}.',
        variables: JSON.stringify(['user_name', 'task_count', 'first_task_time']),
        status: 'pending'
      },
      {
        template_name: 'welcome_message',
        template_id: 'welcome_1',
        category: 'utility',
        body_text: 'Welcome to TeliTask! I\'m your AI assistant. Send me any task, photo, or voice note to get started.',
        variables: JSON.stringify([]),
        status: 'pending'
      }
    ];

    for (const template of templates) {
      const { error } = await supabase
        .from('whatsapp_templates')
        .upsert(template, { onConflict: 'template_name' });
      
      if (error) {
        console.log(`   ⚠️  Failed to create template ${template.template_name}:`, error.message);
      } else {
        console.log(`   ✅ Created template: ${template.template_name}`);
      }
    }

    // Step 6: Send test message (if in sandbox mode)
    if (!isProduction) {
      console.log('\n📤 Ready to send test message!');
      console.log('   Make sure you\'ve joined the sandbox first.');
      console.log('   Would you like to send a test message? (You\'ll need to implement this)\n');
    }

    // Step 7: Configuration summary
    console.log('\n✨ WhatsApp Setup Complete!\n');
    console.log('📋 Next Steps:');
    console.log('1. Configure webhook URL in Twilio Console:');
    console.log(`   ${WEBHOOK_BASE_URL}/api/whatsapp/webhook`);
    console.log('2. If using sandbox, join it from your WhatsApp');
    console.log('3. For production, complete WhatsApp Business verification');
    console.log('4. Test by sending a message to your WhatsApp number\n');

    // Step 8: Environment variables to add
    console.log('🔐 Add these to your .env file:');
    console.log('TWILIO_WHATSAPP_NUMBER=' + TWILIO_WHATSAPP_NUMBER);
    console.log('WHATSAPP_VERIFY_TOKEN=' + generateVerifyToken());
    console.log('\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

function generateVerifyToken() {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

// Optional: Send a test WhatsApp message
async function sendTestMessage(phoneNumber) {
  try {
    const message = await client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phoneNumber}`,
      body: '🎉 TeliTask WhatsApp integration is working! Send me a task to get started.'
    });

    console.log('✅ Test message sent! Message SID:', message.sid);
  } catch (error) {
    console.error('❌ Failed to send test message:', error.message);
  }
}

// Run setup
setupWhatsApp().then(() => {
  // Optionally send a test message
  const testPhoneNumber = process.argv[2];
  if (testPhoneNumber) {
    console.log(`\n📱 Sending test message to ${testPhoneNumber}...`);
    sendTestMessage(testPhoneNumber);
  } else {
    console.log('💡 Tip: Run with a phone number to send a test message:');
    console.log('   node setup-whatsapp.js +1234567890\n');
  }
});