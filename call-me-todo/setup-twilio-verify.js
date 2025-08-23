// Script to create Twilio Verify Service and get the SID
// Run this with: node setup-twilio-verify.js

import { config } from 'dotenv';
import twilio from 'twilio';

config();

async function createVerifyService() {
  // Check if we have the required Twilio credentials
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.error('❌ Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in .env file');
    process.exit(1);
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  try {
    console.log('🔍 Checking for existing Verify services...');
    
    // Check if we already have a Verify service
    const services = await client.verify.v2.services.list({ limit: 10 });
    
    if (services.length > 0) {
      console.log('✅ Found existing Verify service:');
      console.log('Service SID:', services[0].sid);
      console.log('Service Name:', services[0].friendlyName);
      console.log('\n📋 Add this to your Vercel environment variables:');
      console.log(`TWILIO_VERIFY_SERVICE_SID=${services[0].sid}`);
      return services[0].sid;
    }

    console.log('📱 Creating new Twilio Verify service...');
    
    // Create a new Verify service
    const service = await client.verify.v2.services.create({
      friendlyName: 'TeliTask Phone Verification',
      codeLength: 6,
      lookupEnabled: false,
      skipSmsToLandlines: false,
      dtmfInputRequired: false,
      doNotShareWarningEnabled: true
    });

    console.log('✅ Verify service created successfully!');
    console.log('Service SID:', service.sid);
    console.log('Service Name:', service.friendlyName);
    console.log('\n📋 Add this to your Vercel environment variables:');
    console.log(`TWILIO_VERIFY_SERVICE_SID=${service.sid}`);
    
    return service.sid;

  } catch (error) {
    console.error('❌ Error creating Verify service:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.moreInfo) {
      console.error('More info:', error.moreInfo);
    }
    process.exit(1);
  }
}

// Run the function
createVerifyService().then((serviceSid) => {
  console.log(`\n🚀 Next steps:
1. Go to https://vercel.com/karanivincents-projects/call-me-todo/settings/environment-variables
2. Add: TWILIO_VERIFY_SERVICE_SID = ${serviceSid}
3. Redeploy your application
4. Run the migration script in Supabase SQL Editor`);
});