import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import twilio from 'twilio';
import { createSupabaseClient } from '$lib/supabase';

export const POST: RequestHandler = async ({ request, url }) => {
  const taskId = url.searchParams.get('taskId');
  const twiml = new twilio.twiml.VoiceResponse();
  
  if (taskId) {
    // This is a task reminder call
    const supabase = createSupabaseClient();
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (task) {
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, `Hello! This is your Call Me Todo reminder.`);
      
      twiml.pause({ length: 1 });
      
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, `You have a task: ${task.title}.`);
      
      twiml.pause({ length: 1 });
      
      twiml.gather({
        numDigits: 1,
        action: `/api/voice/handle-response?taskId=${taskId}`,
        method: 'POST'
      }).say({
        voice: 'alice',
        language: 'en-US'
      }, 'Press 1 to mark this task as complete, or press 2 to snooze it for 10 minutes.');
      
      // If no input, repeat
      twiml.redirect(`/api/voice/outbound?taskId=${taskId}`);
    } else {
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Task not found. Goodbye!');
    }
  } else {
    // Generic outbound call
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Hello from Call Me Todo. How can I help you manage your tasks today?');
  }

  return text(twiml.toString(), {
    headers: {
      'Content-Type': 'text/xml'
    }
  });
};