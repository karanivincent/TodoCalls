import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import twilio from 'twilio';

export const POST: RequestHandler = async ({ request, url }) => {
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
};