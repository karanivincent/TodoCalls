import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import twilio from 'twilio';
import { createSupabaseClient } from '$lib/supabase';

export const POST: RequestHandler = async ({ request, url }) => {
  const formData = await request.formData();
  const digit = formData.get('Digits');
  const taskId = url.searchParams.get('taskId');
  
  const twiml = new twilio.twiml.VoiceResponse();
  const supabase = createSupabaseClient();
  
  if (taskId && digit) {
    if (digit === '1') {
      // Mark task as complete
      await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);
      
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Great! Your task has been marked as complete. Have a productive day!');
    } else if (digit === '2') {
      // Snooze for 10 minutes
      const { data: task } = await supabase
        .from('tasks')
        .select('scheduled_at')
        .eq('id', taskId)
        .single();
      
      if (task) {
        const newTime = new Date(task.scheduled_at);
        newTime.setMinutes(newTime.getMinutes() + 10);
        
        await supabase
          .from('tasks')
          .update({ 
            scheduled_at: newTime.toISOString(),
            status: 'snoozed'
          })
          .eq('id', taskId);
        
        twiml.say({
          voice: 'alice',
          language: 'en-US'
        }, 'Your task has been snoozed for 10 minutes. I will call you back then.');
      }
    } else {
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Invalid option. Please try again.');
      twiml.redirect(`/api/voice/outbound?taskId=${taskId}`);
    }
  } else {
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Sorry, I did not receive your input. Goodbye!');
  }

  return text(twiml.toString(), {
    headers: {
      'Content-Type': 'text/xml'
    }
  });
};