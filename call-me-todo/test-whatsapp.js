#!/usr/bin/env node

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const WEBHOOK_URL = process.env.WEBHOOK_BASE_URL || 'http://localhost:5173';
const TEST_PHONE = process.env.TEST_PHONE_NUMBER || '+1234567890';

console.log('🧪 WhatsApp Integration Test Suite\n');
console.log(`Testing webhook at: ${WEBHOOK_URL}/api/whatsapp/webhook`);
console.log(`Test phone number: ${TEST_PHONE}\n`);

// Test scenarios
const testScenarios = [
  {
    name: 'Simple task creation',
    message: 'Remind me to call dentist tomorrow at 3pm',
    expectedIntent: 'create_task'
  },
  {
    name: 'Task listing',
    message: 'What tasks do I have today?',
    expectedIntent: 'list_tasks'
  },
  {
    name: 'Task completion',
    message: 'Done with grocery shopping',
    expectedIntent: 'complete_task'
  },
  {
    name: 'Help request',
    message: 'Help',
    expectedIntent: 'help'
  },
  {
    name: 'Greeting',
    message: 'Hello',
    expectedIntent: 'greeting'
  },
  {
    name: 'Multi-task creation',
    message: 'Add three tasks',
    expectedIntent: 'create_task'
  },
  {
    name: 'Guest signup',
    message: 'Sign up',
    expectedIntent: 'signup'
  }
];

// Simulate WhatsApp webhook payload
function createWebhookPayload(message, mediaUrl = null) {
  const formData = new URLSearchParams();
  
  formData.append('MessageSid', 'SM' + Math.random().toString(36).substring(2));
  formData.append('From', `whatsapp:${TEST_PHONE}`);
  formData.append('To', 'whatsapp:+14155238886');
  formData.append('Body', message);
  formData.append('NumMedia', mediaUrl ? '1' : '0');
  
  if (mediaUrl) {
    formData.append('MediaUrl0', mediaUrl);
    formData.append('MediaContentType0', 'image/jpeg');
  }
  
  return formData;
}

// Send test webhook request
async function sendTestWebhook(scenario) {
  try {
    const payload = createWebhookPayload(scenario.message);
    
    const response = await fetch(`${WEBHOOK_URL}/api/whatsapp/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString()
    });

    const statusText = response.ok ? '✅ Success' : '❌ Failed';
    console.log(`${statusText} - ${scenario.name}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`   Error: ${error}`);
    }
    
    return response.ok;
  } catch (error) {
    console.log(`❌ Failed - ${scenario.name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test media message
async function testMediaMessage() {
  console.log('\n📷 Testing media message...');
  
  const mediaPayload = createWebhookPayload(
    'Here is my receipt',
    'https://example.com/receipt.jpg'
  );
  
  try {
    const response = await fetch(`${WEBHOOK_URL}/api/whatsapp/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: mediaPayload.toString()
    });

    if (response.ok) {
      console.log('✅ Media message test passed');
    } else {
      console.log('❌ Media message test failed');
    }
  } catch (error) {
    console.log('❌ Media message test error:', error.message);
  }
}

// Test conversation flow
async function testConversationFlow() {
  console.log('\n💬 Testing multi-turn conversation...');
  
  const conversation = [
    { message: 'Add three tasks', expectedState: 'collecting_task' },
    { message: 'Buy groceries', expectedState: 'collecting_task' },
    { message: '6pm today', expectedState: 'collecting_task' },
    { message: 'Call mom', expectedState: 'collecting_task' },
    { message: 'Tomorrow morning', expectedState: 'collecting_task' },
    { message: 'Submit report', expectedState: 'collecting_task' },
    { message: 'Friday noon', expectedState: 'idle' }
  ];
  
  for (const step of conversation) {
    const payload = createWebhookPayload(step.message);
    
    try {
      const response = await fetch(`${WEBHOOK_URL}/api/whatsapp/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString()
      });

      if (response.ok) {
        console.log(`✅ Step: "${step.message}"`);
      } else {
        console.log(`❌ Failed at: "${step.message}"`);
        break;
      }
      
      // Add delay between messages to simulate real conversation
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`❌ Error at: "${step.message}" - ${error.message}`);
      break;
    }
  }
}

// Load test
async function loadTest(messagesPerSecond = 1, duration = 10) {
  console.log(`\n🔥 Load test: ${messagesPerSecond} msg/s for ${duration}s`);
  
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();
  
  const interval = setInterval(async () => {
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed >= duration) {
      clearInterval(interval);
      console.log(`\n📊 Load test results:`);
      console.log(`   Success: ${successCount}`);
      console.log(`   Failed: ${failCount}`);
      console.log(`   Success rate: ${(successCount / (successCount + failCount) * 100).toFixed(1)}%`);
      return;
    }
    
    // Send random message
    const randomScenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
    const payload = createWebhookPayload(randomScenario.message);
    
    try {
      const response = await fetch(`${WEBHOOK_URL}/api/whatsapp/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString()
      });
      
      if (response.ok) {
        successCount++;
        process.stdout.write('.');
      } else {
        failCount++;
        process.stdout.write('x');
      }
    } catch (error) {
      failCount++;
      process.stdout.write('x');
    }
  }, 1000 / messagesPerSecond);
}

// Main test runner
async function runTests() {
  console.log('🏃 Running WhatsApp integration tests...\n');
  
  // Test webhook availability
  console.log('🔌 Testing webhook endpoint...');
  try {
    const response = await fetch(`${WEBHOOK_URL}/api/whatsapp/webhook`, {
      method: 'GET'
    });
    
    if (response.status === 403 || response.status === 200) {
      console.log('✅ Webhook endpoint is accessible\n');
    } else {
      console.log('⚠️  Unexpected webhook response:', response.status);
    }
  } catch (error) {
    console.log('❌ Cannot reach webhook endpoint:', error.message);
    console.log('   Make sure your server is running');
    process.exit(1);
  }
  
  // Run test scenarios
  console.log('📝 Testing message scenarios...');
  let passed = 0;
  let failed = 0;
  
  for (const scenario of testScenarios) {
    const result = await sendTestWebhook(scenario);
    if (result) passed++;
    else failed++;
    
    // Add small delay between tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  // Test media message
  await testMediaMessage();
  
  // Test conversation flow
  await testConversationFlow();
  
  // Optional: Run load test
  const runLoadTest = process.argv.includes('--load');
  if (runLoadTest) {
    await loadTest(2, 5); // 2 messages per second for 5 seconds
  }
  
  console.log('\n✅ Test suite complete!');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});