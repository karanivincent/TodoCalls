import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import twilio from 'twilio';

// Allow public access for Twilio webhooks
// Twilio may use GET for validation
export const GET: RequestHandler = async () => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Test call endpoint is active.');
  
  return text(twiml.toString(), {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'no-cache'
    }
  });
};

export const POST: RequestHandler = async ({ request, url }) => {
  try {
  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Hello! This is your Call Me Todo AI assistant test call.');
  
  twiml.pause({ length: 1 });
  
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, 'I can help you manage your tasks through natural conversation. You can ask me to create new tasks, list your upcoming reminders, or mark tasks as complete.');
  
  twiml.pause({ length: 1 });
  
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, 'When fully activated, I will use OpenAI to understand your voice commands and manage your tasks naturally. Thank you for testing Call Me Todo!');
  
  twiml.pause({ length: 1 });
  
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Goodbye!');

    return text(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  } catch (error: any) {
    console.error('Test call error:', error);
    
    // Return a simple TwiML response even on error
    const errorTwiml = new twilio.twiml.VoiceResponse();
    errorTwiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'We apologize, but there was an error processing your request. Please try again later.');
    
    return text(errorTwiml.toString(), {
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  }
};