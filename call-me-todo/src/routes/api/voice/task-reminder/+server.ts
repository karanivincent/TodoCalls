import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

import { addAudioToCache } from '$lib/audio-cache';

export const POST: RequestHandler = async ({ request, url }) => {
	console.log(`Task reminder POST request at ${url.pathname}`);
	
	// Initialize clients inside the handler to ensure env vars are available
	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey = privateEnv.SUPABASE_SERVICE_ROLE_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	const openaiKey = privateEnv.OPENAI_API_KEY;
	
	// Log environment status for debugging
	console.log('Environment check:', {
		hasSupabaseUrl: !!supabaseUrl,
		hasSupabaseKey: !!supabaseKey,
		hasServiceKey: !!privateEnv.SUPABASE_SERVICE_ROLE_KEY,
		hasOpenAIKey: !!openaiKey,
		url: supabaseUrl ? 'Set' : 'Missing'
	});
	
	// Validate required environment variables
	if (!supabaseUrl || !supabaseKey) {
		console.error('Missing Supabase credentials:', {
			url: supabaseUrl || 'MISSING',
			key: supabaseKey ? 'Present' : 'MISSING'
		});
		const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Configuration error. Please contact support.</Say>
</Response>`;
		return new Response(twiml, {
			headers: {
				'Content-Type': 'text/xml',
				'Cache-Control': 'no-cache'
			}
		});
	}
	
	if (!openaiKey) {
		console.error('Missing OpenAI API key');
	}
	
	// Create clients with validated credentials
	const supabase = createClient(supabaseUrl, supabaseKey);
	const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
	
	// Parse form data from Twilio
	const formData = await request.formData();
	const body: any = {};
	for (const [key, value] of formData) {
		body[key] = value;
	}
	
	// Get task ID from query params or body
	const taskId = url.searchParams.get('taskId') || body.taskId;
	const digits = body.Digits; // For user input via keypad
	const speechResult = body.SpeechResult; // For voice input
	
	console.log('Task reminder request:', {
		method: request.method,
		taskId,
		digits,
		speechResult,
		query: Object.fromEntries(url.searchParams),
		body
	});
	
	if (!taskId) {
		console.error('No task ID provided');
		const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Error: No task ID provided for this reminder.</Say>
</Response>`;
		return new Response(twiml, {
			headers: {
				'Content-Type': 'text/xml',
				'Cache-Control': 'no-cache'
			}
		});
	}
	
	try {
		// Fetch task details from Supabase
		console.log('Fetching task with ID:', taskId);
		console.log('Using service key:', !!privateEnv.SUPABASE_SERVICE_ROLE_KEY);
		
		const { data: task, error } = await supabase
			.from('tasks')
			.select('*')
			.eq('id', taskId)
			.single();
		
		if (error) {
			console.error('Supabase error fetching task:', {
				message: error.message,
				code: error.code,
				details: error.details
			});
			
			let errorMessage = "Sorry, I couldn't find the task details.";
			if (error.code === 'PGRST116') {
				errorMessage = "Task not found. It may have been deleted.";
			} else if (error.message?.includes('row-level')) {
				errorMessage = "Database permission error. Please check the configuration.";
			}
			
			const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${errorMessage}</Say>
</Response>`;
			return new Response(twiml, {
				headers: {
					'Content-Type': 'text/xml',
					'Cache-Control': 'no-cache'
				}
			});
		}
		
		if (!task) {
			console.error('No task found with ID:', taskId);
			const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, I couldn't find that task. It may have been deleted.</Say>
</Response>`;
			return new Response(twiml, {
				headers: {
					'Content-Type': 'text/xml',
					'Cache-Control': 'no-cache'
				}
			});
		}
		
		console.log('Task found:', { 
			id: task.id, 
			title: task.title, 
			status: task.status 
		});
		
		// Handle user response (if any)
		if (digits || speechResult) {
			return handleUserResponse(task, digits, speechResult, supabase);
		}
		
		// Generate personalized reminder message
		const reminderScript = await generateReminderScript(task, openai);
		console.log('Generated script:', reminderScript);
		
		// Generate high-quality audio if OpenAI is available
		if (!openai) {
			// Fallback to Twilio Say if OpenAI is not available
			const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${task.title}. Press 1 to mark complete, 2 to snooze for 10 minutes, or 3 to reschedule.</Say>
  <Gather action="/api/voice/task-reminder?taskId=${taskId}" method="POST" numDigits="1" timeout="5">
    <Pause length="2"/>
  </Gather>
</Response>`;
			return new Response(twiml, {
				headers: {
					'Content-Type': 'text/xml',
					'Cache-Control': 'no-cache'
				}
			});
		}
		
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
		addAudioToCache(audioId, audioBuffer);
		
		// Use the dedicated audio serving route
		const audioUrl = `${url.origin}/api/voice/task-reminder-audio/${audioId}`;
		
		// Return TwiML with audio and gather for user response
		const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather action="/api/voice/task-reminder?taskId=${taskId}" method="POST" numDigits="1" timeout="5">
    <Say voice="alice">Press 1 to mark complete, 2 to snooze for 10 minutes, or 3 to reschedule.</Say>
  </Gather>
  <Say voice="alice">Goodbye!</Say>
</Response>`;
		
		return new Response(twiml, {
			headers: {
				'Content-Type': 'text/xml',
				'Cache-Control': 'no-cache'
			}
		});
		
	} catch (error: any) {
		console.error('Error in task reminder:', error);
		
		// Fallback TwiML
		const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">This is your task reminder. You have a scheduled task. Press 1 to mark complete or 2 to snooze.</Say>
  <Gather action="/api/voice/task-reminder?taskId=${taskId}" method="POST" numDigits="1" timeout="5">
    <Pause length="2"/>
  </Gather>
</Response>`;
		
		return new Response(twiml, {
			headers: {
				'Content-Type': 'text/xml',
				'Cache-Control': 'no-cache'
			}
		});
	}
};

// Removed GET handler to prevent catch-all routing issues
// Audio will be served via the Vercel function instead

async function generateReminderScript(task: any, openai: OpenAI | null): Promise<string> {
	const now = new Date();
	const timeOfDay = now.getHours() < 12 ? 'morning' : 
					   now.getHours() < 17 ? 'afternoon' : 'evening';
	
	// If no OpenAI client, return a simple message
	if (!openai) {
		return `Good ${timeOfDay}! This is your reminder: ${task.title}. I'm here to help you stay on track.`;
	}
	
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
		
		return completion.choices[0].message.content || `Good ${timeOfDay}! This is your reminder: ${task.title}.`;
	} catch (error) {
		console.error('Error generating script:', error);
		return `Good ${timeOfDay}! This is your reminder: ${task.title}. I'm here to help you stay on track.`;
	}
}

async function handleUserResponse(task: any, digits: string, speechResult: string, supabase: any) {
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
	
	return new Response(twiml, {
		headers: {
			'Content-Type': 'text/xml',
			'Cache-Control': 'no-cache'
		}
	});
}