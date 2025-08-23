import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerClient } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';
import twilio from 'twilio';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`📞 [TEST-REMINDER] [${requestId}] ===== Starting test reminder API =====`);
  
  try {
    // Initialize Twilio client inside the function
    console.log(`📞 [TEST-REMINDER] [${requestId}] Initializing Twilio client...`);
    const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    
    const { taskId } = await request.json();
    console.log(`📞 [TEST-REMINDER] [${requestId}] Received taskId:`, taskId);
    
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
    console.log(`📞 [TEST-REMINDER] [${requestId}] Querying database for task...`);
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (taskError || !task) {
      console.error(`📞 [TEST-REMINDER] [${requestId}] ❌ Task not found:`, { taskError, taskId });
      return json({ error: 'Task not found' }, { status: 404 });
    }
    
    console.log(`📞 [TEST-REMINDER] [${requestId}] ✅ Task found:`, {
      id: task.id,
      title: task.title,
      phone: task.phone_number,
      scheduled: task.scheduled_at
    });
    
    // Check authorization
    console.log(`📞 [TEST-REMINDER] [${requestId}] Checking user authorization...`);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || task.user_id !== user.id) {
      console.error(`📞 [TEST-REMINDER] [${requestId}] ❌ Unauthorized access attempt`);
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`📞 [TEST-REMINDER] [${requestId}] ✅ User authorized:`, user.id);
    
    // Initiate test call
    const baseUrl = 'https://telitask.com';
    const webhookUrl = `${baseUrl}/api/voice/task-reminder?taskId=${task.id}`;
    
    console.log(`📞 [TEST-REMINDER] [${requestId}] Creating Twilio call:`, {
      to: task.phone_number,
      from: env.TWILIO_PHONE_NUMBER,
      webhookUrl
    });
    
    const call = await twilioClient.calls.create({
      to: task.phone_number,
      from: env.TWILIO_PHONE_NUMBER,
      url: webhookUrl,
      method: 'POST',
      statusCallback: `${baseUrl}/api/voice/status`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      timeout: 60,
      record: false
    });
    
    console.log(`📞 [TEST-REMINDER] [${requestId}] ✅ Twilio call created successfully:`, {
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from
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