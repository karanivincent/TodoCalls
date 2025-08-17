#!/usr/bin/env node

import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !phoneNumber) {
  console.error('Missing Twilio credentials. Please check your .env file.');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

// Your deployed Vercel URL
const VERCEL_URL = 'https://call-me-todo.vercel.app';

async function configureTwilioPhoneNumber() {
  try {
    console.log(`Configuring Twilio phone number: ${phoneNumber}`);
    
    // Find the phone number resource
    const phoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: phoneNumber
    });
    
    if (phoneNumbers.length === 0) {
      console.error('Phone number not found in your Twilio account');
      return;
    }
    
    const phoneNumberSid = phoneNumbers[0].sid;
    
    // Update the phone number configuration
    const updatedNumber = await client.incomingPhoneNumbers(phoneNumberSid)
      .update({
        voiceUrl: `${VERCEL_URL}/api/voice/incoming`,
        voiceMethod: 'POST',
        statusCallback: `${VERCEL_URL}/api/voice/status`,
        statusCallbackMethod: 'POST',
        voiceFallbackUrl: `${VERCEL_URL}/api/voice/fallback`,
        voiceFallbackMethod: 'POST'
      });
    
    console.log('✅ Successfully configured Twilio phone number!');
    console.log('Configuration:');
    console.log(`  Voice URL: ${updatedNumber.voiceUrl}`);
    console.log(`  Status Callback: ${updatedNumber.statusCallback}`);
    console.log(`  Fallback URL: ${updatedNumber.voiceFallbackUrl}`);
    console.log('\nYour Twilio phone number is now configured to work with your deployed Call-Me Todo app!');
    console.log(`App URL: ${VERCEL_URL}`);
    console.log(`Phone Number: ${phoneNumber}`);
    
  } catch (error) {
    console.error('Error configuring Twilio phone number:', error.message);
    if (error.code === 20003) {
      console.error('Authentication failed. Please check your Twilio credentials.');
    }
  }
}

configureTwilioPhoneNumber();