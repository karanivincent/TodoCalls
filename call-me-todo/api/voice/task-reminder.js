import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Use service key if available for bypassing RLS, otherwise use anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  supabaseKey
);

// Cache for audio files (in production, use proper storage)
const audioCache = new Map();

export default async function handler(req, res) {
  console.log(`Task reminder ${req.method} request at ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Twilio-Signature');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  // Check if this is an audio request
  const url = new URL(req.url, `https://${req.headers.host}`);
  if (url.pathname.includes('/audio/')) {
    const audioId = url.pathname.split('/audio/')[1];
    const audioBuffer = audioCache.get(audioId);
    
    if (audioBuffer) {
      console.log(`Serving audio ${audioId}`);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.status(200).end(audioBuffer);
      setTimeout(() => audioCache.delete(audioId), 60000);
      return;
    } else {
      res.status(404).end('Audio not found');
      return;
    }
  }
  
  // Get task ID from query params or body
  const taskId = req.query?.taskId || req.body?.taskId;
  const digits = req.body?.Digits; // For user input via keypad
  const speechResult = req.body?.SpeechResult; // For voice input
  
  console.log('Task reminder request:', {
    method: req.method,
    taskId,
    digits,
    speechResult,
    query: req.query,
    body: req.body
  });
  
  if (!taskId) {
    console.error('No task ID provided');
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Error: No task ID provided for this reminder.</Say>
</Response>`;
    res.status(200).setHeader('Content-Type', 'text/xml').send(twiml);
    return;
  }
  
  try {
    // Fetch task details from Supabase
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (error || !task) {
      console.error('Task not found:', error);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, I couldn't find the task details.</Say>
</Response>`;
      res.status(200).setHeader('Content-Type', 'text/xml').send(twiml);
      return;
    }
    
    // Handle user response (if any)
    if (digits || speechResult) {
      return handleUserResponse(req, res, task, digits, speechResult);
    }
    
    // Generate personalized reminder message
    const reminderScript = await generateReminderScript(task);
    console.log('Generated script:', reminderScript);
    
    // Generate high-quality audio
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: 'nova',
      input: reminderScript,
      response_format: 'mp3',
      speed: 1.0
    });
    
    // Convert to buffer and cache
    const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
    const audioId = `audio_${taskId}_${Date.now()}`;
    audioCache.set(audioId, audioBuffer);
    setTimeout(() => audioCache.delete(audioId), 300000);
    
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const audioUrl = `${protocol}://${host}/api/voice/task-reminder/audio/${audioId}`;
    
    // Return TwiML with audio and gather for user response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather action="/api/voice/task-reminder?taskId=${taskId}" method="POST" numDigits="1" timeout="5">
    <Say voice="alice">Press 1 to mark complete, 2 to snooze for 10 minutes, or 3 to reschedule.</Say>
  </Gather>
  <Say voice="alice">Goodbye!</Say>
</Response>`;
    
    res.status(200).setHeader('Content-Type', 'text/xml').send(twiml);
    
  } catch (error) {
    console.error('Error in task reminder:', error);
    
    // Fallback TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">This is your task reminder. ${task?.title || 'You have a scheduled task.'} Press 1 to mark complete or 2 to snooze.</Say>
  <Gather action="/api/voice/task-reminder?taskId=${taskId}" method="POST" numDigits="1" timeout="5">
    <Pause length="2"/>
  </Gather>
</Response>`;
    
    res.status(200).setHeader('Content-Type', 'text/xml').send(twiml);
  }
}

async function generateReminderScript(task) {
  const now = new Date();
  const timeOfDay = now.getHours() < 12 ? 'morning' : 
                     now.getHours() < 17 ? 'afternoon' : 'evening';
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Nova, a warm and friendly AI assistant making a reminder call.
          Generate a natural, conversational reminder message. Be encouraging and helpful.
          Keep it brief (2-3 sentences) and end by mentioning the options available.
          The time of day is ${timeOfDay}.`
        },
        {
          role: 'user',
          content: `Create a reminder message for this task: "${task.title}"`
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating script:', error);
    return `Good ${timeOfDay}! This is your reminder: ${task.title}. I'm here to help you stay on track.`;
  }
}

async function handleUserResponse(req, res, task, digits, speechResult) {
  let action = '';
  
  if (digits === '1') {
    action = 'complete';
  } else if (digits === '2') {
    action = 'snooze';
  } else if (digits === '3') {
    action = 'reschedule';
  }
  
  console.log(`User action for task ${task.id}: ${action}`);
  
  let responseMessage = '';
  
  try {
    if (action === 'complete') {
      // Mark task as completed
      await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id);
      
      responseMessage = "Great job! I've marked your task as complete. Keep up the excellent work!";
      
    } else if (action === 'snooze') {
      // Snooze for 10 minutes
      const snoozeTime = new Date(Date.now() + 10 * 60 * 1000);
      await supabase
        .from('tasks')
        .update({ 
          scheduled_at: snoozeTime.toISOString(),
          status: 'pending'
        })
        .eq('id', task.id);
      
      responseMessage = "No problem! I'll remind you again in 10 minutes. Stay focused!";
      
    } else if (action === 'reschedule') {
      // For MVP, we'll snooze for 1 hour
      const rescheduleTime = new Date(Date.now() + 60 * 60 * 1000);
      await supabase
        .from('tasks')
        .update({ 
          scheduled_at: rescheduleTime.toISOString(),
          status: 'pending'
        })
        .eq('id', task.id);
      
      responseMessage = "I've rescheduled your task for one hour from now. I'll call you then!";
      
    } else {
      responseMessage = "I didn't catch that. The task remains scheduled. Goodbye!";
    }
    
  } catch (error) {
    console.error('Error updating task:', error);
    responseMessage = "Sorry, I had trouble updating your task. Please try again later.";
  }
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${responseMessage}</Say>
</Response>`;
  
  res.status(200).setHeader('Content-Type', 'text/xml').send(twiml);
}