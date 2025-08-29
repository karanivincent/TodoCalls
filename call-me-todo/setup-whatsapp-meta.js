#!/usr/bin/env node

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || 'v22.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '775743698957535';
const BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '7781763482411982';
const WEBHOOK_URL = process.env.WEBHOOK_BASE_URL || 'https://telitask.com';
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'telitask_verify_token_2024';

console.log('🚀 Meta WhatsApp Business API Setup for TeliTask\n');
console.log('📱 Test Number: +1 555 193 2671');
console.log('🆔 Business Account ID:', BUSINESS_ACCOUNT_ID);
console.log('📞 Phone Number ID:', PHONE_NUMBER_ID);
console.log('🔗 Webhook URL:', `${WEBHOOK_URL}/api/whatsapp/webhook-meta`);
console.log('🔑 Verify Token:', VERIFY_TOKEN);
console.log('\n');

// Test the Graph API connection
async function testConnection() {
  console.log('🔌 Testing Meta Graph API connection...\n');
  
  if (!ACCESS_TOKEN) {
    console.error('❌ Error: WHATSAPP_ACCESS_TOKEN not set in environment variables');
    console.log('\n📝 To get an access token:');
    console.log('1. Go to the API Setup page in Meta for Developers');
    console.log('2. Click "Generate access token"');
    console.log('3. Copy the token and add it to your .env file');
    return false;
  }
  
  try {
    // Test by getting phone number details
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Connected successfully!');
      console.log('📱 Phone number details:', data);
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Connection failed:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

// Send a test message
async function sendTestMessage(recipientNumber) {
  console.log(`\n📤 Sending test message to ${recipientNumber}...`);
  
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: recipientNumber.replace(/[^\d]/g, ''), // Remove non-digits
    type: 'text',
    text: {
      preview_url: false,
      body: '🎉 Welcome to TeliTask!\n\nYour WhatsApp integration is working! I can help you:\n• Create task reminders\n• Process photos of receipts or lists\n• Manage your schedule\n\nSend me any task or "help" to get started!'
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
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test message sent successfully!');
      console.log('Message ID:', result.messages[0].id);
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Failed to send message:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending message:', error.message);
    return false;
  }
}

// Configure webhook
async function configureWebhook() {
  console.log('\n⚙️ Webhook Configuration\n');
  console.log('To configure your webhook in Meta for Developers:');
  console.log('1. Go to your app dashboard');
  console.log('2. Navigate to WhatsApp > Configuration');
  console.log('3. In the Webhook section, click "Edit"');
  console.log('4. Enter the following details:\n');
  console.log(`   Callback URL: ${WEBHOOK_URL}/api/whatsapp/webhook-meta`);
  console.log(`   Verify Token: ${VERIFY_TOKEN}`);
  console.log('\n5. Subscribe to these webhook fields:');
  console.log('   ✓ messages');
  console.log('   ✓ message_status');
  console.log('   ✓ message_template_status_update');
  console.log('\n6. Click "Verify and Save"');
}

// Create message templates
async function createTemplates() {
  console.log('\n📝 Message Templates\n');
  console.log('To create message templates:');
  console.log('1. Go to Meta Business Suite');
  console.log('2. Navigate to WhatsApp Manager > Message Templates');
  console.log('3. Create these templates:\n');
  
  const templates = [
    {
      name: 'task_reminder',
      category: 'UTILITY',
      body: 'Hi {{1}}, this is your reminder for: {{2}} scheduled at {{3}}'
    },
    {
      name: 'daily_summary',
      category: 'UTILITY',
      body: 'Good morning {{1}}! You have {{2}} tasks today. Your first task is at {{3}}.'
    },
    {
      name: 'welcome_message',
      category: 'UTILITY',
      body: 'Welcome to TeliTask! I\'m your AI assistant. Send me any task, photo, or voice note to get started.'
    }
  ];
  
  templates.forEach(template => {
    console.log(`Template: ${template.name}`);
    console.log(`Category: ${template.category}`);
    console.log(`Body: ${template.body}`);
    console.log('---');
  });
}

// Test webhook endpoint
async function testWebhookEndpoint() {
  console.log('\n🧪 Testing your webhook endpoint...');
  
  const webhookUrl = `${WEBHOOK_URL}/api/whatsapp/webhook-meta`;
  
  try {
    // Test GET request (verification)
    const verifyUrl = `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test_challenge`;
    const response = await fetch(verifyUrl);
    
    if (response.ok) {
      const result = await response.text();
      if (result === 'test_challenge') {
        console.log('✅ Webhook verification endpoint working!');
        return true;
      }
    }
    
    console.error('❌ Webhook verification failed');
    return false;
  } catch (error) {
    console.error('❌ Cannot reach webhook endpoint:', error.message);
    console.log('Make sure your server is deployed and accessible');
    return false;
  }
}

// Main setup flow
async function runSetup() {
  console.log('Starting WhatsApp Business API setup...\n');
  console.log('='.repeat(50));
  
  // Step 1: Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log('\n⚠️ Please configure your access token first');
    process.exit(1);
  }
  
  // Step 2: Test webhook
  await testWebhookEndpoint();
  
  // Step 3: Configure webhook
  await configureWebhook();
  
  // Step 4: Create templates
  await createTemplates();
  
  // Step 5: Send test message (optional)
  const recipientNumber = process.argv[2];
  if (recipientNumber) {
    await sendTestMessage(recipientNumber);
  } else {
    console.log('\n💡 To send a test message, run:');
    console.log(`   node setup-whatsapp-meta.js +1234567890`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✨ Setup Complete!\n');
  console.log('Next steps:');
  console.log('1. Configure webhook in Meta for Developers dashboard');
  console.log('2. Create message templates in Meta Business Suite');
  console.log('3. Test by sending a message to +1 555 193 2671');
  console.log('4. Monitor logs for incoming messages');
  console.log('\n📚 Documentation: https://developers.facebook.com/docs/whatsapp');
}

// Run setup
runSetup().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});