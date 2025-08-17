import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import twilio from 'twilio';

export const POST: RequestHandler = async ({ request }) => {
  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say({
    voice: 'alice'
  }, 'Welcome to Call Me Todo. This is your AI-powered task management assistant. How can I help you today?');
  
  twiml.pause({ length: 1 });
  
  twiml.say({
    voice: 'alice'
  }, 'You can say things like: Create a new task, List my tasks, or Mark a task as complete.');
  
  twiml.pause({ length: 2 });
  
  twiml.say({
    voice: 'alice'
  }, 'Please note that the full AI integration is being set up. For now, this is a demo message.');

  return text(twiml.toString(), {
    headers: {
      'Content-Type': 'text/xml'
    }
  });
};