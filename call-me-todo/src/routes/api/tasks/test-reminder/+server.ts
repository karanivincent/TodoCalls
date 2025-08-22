import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerClient } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';
import twilio from 'twilio';
import { env } from '$env/dynamic/private';

const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { taskId } = await request.json();
    
    if (!taskId) {
      return json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Create a proper server client with cookie handling
    const supabase = createServerClient(publicEnv.PUBLIC_SUPABASE_URL, publicEnv.PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookies.set(name, value, { ...options, path: '/' })
          );
        }
      }
    });
    
    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (taskError || !task) {
      return json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Check authorization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || task.user_id !== user.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Initiate test call
    const baseUrl = 'https://telitask.com';
    
    const call = await twilioClient.calls.create({
      to: task.phone_number,
      from: env.TWILIO_PHONE_NUMBER,
      url: `${baseUrl}/api/voice/task-reminder?taskId=${task.id}`,
      method: 'POST',
      statusCallback: `${baseUrl}/api/voice/status`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      timeout: 60,
      record: false
    });
    
    return json({
      success: true,
      callSid: call.sid,
      message: `Test reminder call initiated for task: ${task.title}`
    });
    
  } catch (error: any) {
    console.error('Error initiating test reminder:', error);
    return json({ 
      error: error.message || 'Failed to initiate test reminder' 
    }, { status: 500 });
  }
};