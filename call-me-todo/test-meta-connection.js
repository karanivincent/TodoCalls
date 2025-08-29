#!/usr/bin/env node

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load WhatsApp specific env file
const whatsappEnvPath = join(__dirname, '.env.whatsapp');
if (fs.existsSync(whatsappEnvPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(whatsappEnvPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

// Also load main .env
dotenv.config();

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '775743698957535';
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || 'v22.0';

console.log('🔌 Testing WhatsApp Business API Connection\n');
console.log('📱 Phone Number ID:', PHONE_NUMBER_ID);
console.log('🔑 Access Token:', ACCESS_TOKEN ? 'Found (' + ACCESS_TOKEN.substring(0, 20) + '...)' : 'Not found');
console.log('📊 API Version:', GRAPH_API_VERSION);
console.log('\n');

async function testConnection() {
  try {
    // Test 1: Get phone number details
    console.log('📞 Fetching phone number details...');
    const phoneResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    if (phoneResponse.ok) {
      const phoneData = await phoneResponse.json();
      console.log('✅ Phone number verified!');
      console.log('   Display Number:', phoneData.display_phone_number);
      console.log('   Verified Name:', phoneData.verified_name);
      console.log('   Quality Rating:', phoneData.quality_rating || 'Not available for test numbers');
      console.log('\n');
    } else {
      const error = await phoneResponse.text();
      console.error('❌ Failed to get phone number details:', error);
      return false;
    }

    // Test 2: Get message templates
    console.log('📝 Checking message templates...');
    const templatesResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    if (templatesResponse.ok) {
      const templatesData = await templatesResponse.json();
      console.log('✅ Templates accessible!');
      if (templatesData.data && templatesData.data.length > 0) {
        console.log(`   Found ${templatesData.data.length} template(s):`);
        templatesData.data.forEach(template => {
          console.log(`   - ${template.name} (${template.status})`);
        });
      } else {
        console.log('   No templates found (this is normal for new accounts)');
      }
      console.log('\n');
    }

    return true;

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function sendTestMessage(recipientNumber) {
  if (!recipientNumber) {
    console.log('💡 To send a test message, provide a phone number:');
    console.log('   node test-meta-connection.js +1234567890\n');
    return;
  }

  console.log(`📤 Sending test message to ${recipientNumber}...\n`);

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  
  // Clean the phone number (remove spaces, dashes, etc.)
  const cleanNumber = recipientNumber.replace(/[^\d+]/g, '').replace(/^\+/, '');

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanNumber,
    type: 'text',
    text: {
      preview_url: false,
      body: `🎉 TeliTask WhatsApp Integration Test!\n\nYour connection is working! I can help you:\n• Create task reminders\n• Process photos\n• Manage your schedule\n\nReply with any task or "help" to get started!`
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Message sent successfully!');
      console.log('   Message ID:', result.messages[0].id);
      console.log('   Recipient:', result.contacts[0].wa_id);
      console.log('\n');
    } else {
      console.error('❌ Failed to send message:');
      console.error(responseText);
      
      // Parse error for common issues
      try {
        const error = JSON.parse(responseText);
        if (error.error) {
          console.log('\n💡 Error details:');
          console.log('   Code:', error.error.code);
          console.log('   Message:', error.error.message);
          
          if (error.error.code === 131030) {
            console.log('\n📱 The recipient needs to initiate conversation first.');
            console.log('   Ask them to send a message to +1 555 193 2671');
          } else if (error.error.code === 100) {
            console.log('\n🔑 Access token issue. Please check your token.');
          }
        }
      } catch (e) {
        // Error parsing failed, already logged
      }
      console.log('\n');
    }
  } catch (error) {
    console.error('❌ Error sending message:', error.message);
    console.log('\n');
  }
}

async function showWebhookInfo() {
  console.log('🔗 Webhook Configuration\n');
  console.log('Add this to your Meta App Dashboard:\n');
  console.log('Callback URL:');
  console.log('  Production: https://telitask.com/api/whatsapp/webhook-meta');
  console.log('  Local (ngrok): https://YOUR_NGROK_ID.ngrok.io/api/whatsapp/webhook-meta\n');
  console.log('Verify Token: telitask_verify_token_2024\n');
  console.log('Subscribe to these fields:');
  console.log('  ✓ messages');
  console.log('  ✓ message_status');
  console.log('  ✓ message_template_status_update\n');
}

async function main() {
  console.log('='.repeat(60));
  console.log('WhatsApp Business API Test - TeliTask');
  console.log('='.repeat(60));
  console.log('\n');

  if (!ACCESS_TOKEN) {
    console.error('❌ Access token not found!');
    console.log('\n💡 Add your token to .env.whatsapp:');
    console.log('   WHATSAPP_ACCESS_TOKEN=YOUR_TOKEN_HERE\n');
    process.exit(1);
  }

  // Test connection
  const connected = await testConnection();
  
  if (connected) {
    console.log('✅ Connection successful!\n');
    
    // Show webhook info
    await showWebhookInfo();
    
    // Send test message if phone number provided
    const recipientNumber = process.argv[2];
    await sendTestMessage(recipientNumber);
    
    console.log('='.repeat(60));
    console.log('✨ Setup Complete!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Configure webhook in Meta dashboard');
    console.log('2. Deploy to Vercel: vercel --prod');
    console.log('3. Test by sending a message to +1 555 193 2671');
  } else {
    console.log('❌ Connection failed. Please check your access token.\n');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});