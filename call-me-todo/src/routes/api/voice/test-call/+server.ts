import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import twilio from 'twilio';

// This endpoint must be publicly accessible for Twilio

// Handle GET requests (Twilio validation)
export const GET: RequestHandler = async () => {
  console.log('Test call GET request received');
  
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say({
    voice: 'alice',
    language: 'en-US'
  }, 'Test call endpoint is active.');
  
  return new Response(twiml.toString(), {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
};

// Handle POST requests (actual calls)
export const POST: RequestHandler = async ({ request }) => {
  console.log('Test call POST request received');
  
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

    return new Response(twiml.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Test call error:', error);
    
    // Return error TwiML
    const errorTwiml = new twilio.twiml.VoiceResponse();
    errorTwiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Sorry, an error occurred. Please try again later.');
    
    return new Response(errorTwiml.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
};