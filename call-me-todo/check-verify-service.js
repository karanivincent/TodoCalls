import { config } from 'dotenv';
import twilio from 'twilio';

config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

console.log('Checking Verify service configuration...');
console.log('Service SID:', serviceSid);

try {
  const service = await client.verify.v2.services(serviceSid).fetch();
  
  console.log('\nService Configuration:');
  console.log('Friendly Name:', service.friendlyName);
  console.log('Code Length:', service.codeLength);
  console.log('Lookup Enabled:', service.lookupEnabled);
  console.log('PSD2 Enabled:', service.psd2Enabled);
  console.log('Skip SMS to Landlines:', service.skipSmsToLandlines);
  console.log('DTMF Input Required:', service.dtmfInputRequired);
  console.log('TTS Name:', service.ttsName);
  console.log('Do Not Share Warning Enabled:', service.doNotShareWarningEnabled);
  console.log('Custom Code Enabled:', service.customCodeEnabled);
  console.log('Push Include Date:', service.pushIncludeDate);
  console.log('Push App Hash:', service.pushApnCredentialSid);
  console.log('Default Template SID:', service.defaultTemplateSid);
  
  // Check if there are any rate limits
  const rateLimits = await client.verify.v2.services(serviceSid).rateLimits.list();
  console.log('\nRate Limits:');
  rateLimits.forEach(limit => {
    console.log(`- ${limit.uniqueName}: ${limit.bucketSize} requests per ${limit.interval} seconds`);
  });
  
} catch (error) {
  console.error('Error fetching service details:', error);
}