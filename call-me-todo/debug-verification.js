import { config } from 'dotenv';
import twilio from 'twilio';

config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const phoneNumber = '+254704985136';

console.log('Debugging verification flow...');
console.log('Service SID:', serviceSid);
console.log('Phone Number:', phoneNumber);

try {
  // Test sending a new verification
  console.log('\nSending test verification...');
  const newVerification = await client.verify.v2.services(serviceSid).verifications.create({
    to: phoneNumber,
    channel: 'sms'
  });
  
  console.log('New verification sent:');
  console.log('SID:', newVerification.sid);
  console.log('Status:', newVerification.status);
  console.log('Valid:', newVerification.valid);
  console.log('Created:', newVerification.dateCreated);
  
  // Wait a moment then try to check the verification with a test code
  console.log('\nWaiting 2 seconds then testing verification check...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const testCheck = await client.verify.v2.services(serviceSid).verificationChecks.create({
      to: phoneNumber,
      code: '123456' // Wrong code, just to test the API
    });
    console.log('Test check result:', testCheck.status);
  } catch (checkError) {
    console.log('Test check error (expected):', checkError.code, checkError.message);
  }
  
} catch (error) {
  console.error('Error in verification debug:', error);
  console.error('Error details:', JSON.stringify(error, null, 2));
}