import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

import { addAudioToCache } from '$lib/audio-cache';
import { parseTwilioRequest, errorTwiML, logError } from '$lib/twilio-utils';

export const POST: RequestHandler = async ({ request, url }) => {
	const requestId = Math.random().toString(36).substring(7);
	const startTime = Date.now();
	
	console.log(`📞 [${requestId}] Task reminder webhook called:`, {
		method: request.method,
		url: url.toString(),
		pathname: url.pathname,
		searchParams: Object.fromEntries(url.searchParams),
		headers: Object.fromEntries(request.headers.entries()),
		timestamp: new Date().toISOString()
	});
	
	try {
		// Initialize clients inside the handler to ensure env vars are available
		const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
		const supabaseKey = privateEnv.SUPABASE_SERVICE_ROLE_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
		const openaiKey = privateEnv.OPENAI_API_KEY;
	
		// Log environment status for debugging
		console.log(`[${requestId}] Environment check:`, {
			hasSupabaseUrl: !!supabaseUrl,
			hasSupabaseKey: !!supabaseKey,
			hasServiceKey: !!privateEnv.SUPABASE_SERVICE_ROLE_KEY,
			hasOpenAIKey: !!openaiKey,
			supabaseUrl: supabaseUrl || 'MISSING'
		});
	
		// Validate required environment variables
		if (!supabaseUrl || !supabaseKey) {
			logError(`[${requestId}] Missing Supabase credentials`, new Error('Configuration error'), {
				url: supabaseUrl || 'MISSING',
				key: supabaseKey ? 'Present' : 'MISSING'
			});
			return new Response(errorTwiML('Configuration error', true), {
				headers: {
					'Content-Type': 'text/xml',
					'Cache-Control': 'no-cache',
					'X-Request-ID': requestId,
					'X-Error-Type': 'configuration'
				}
			});
		}
	
		if (!openaiKey) {
			console.warn(`[${requestId}] Missing OpenAI API key - will use fallback voice`);
		}
	
		// Create clients with validated credentials
		const supabase = createClient(supabaseUrl, supabaseKey);
		const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
		
		// Safely parse request body from Twilio
		const body = await parseTwilioRequest(request);
	
		// Get task ID from query params or body
		const taskId = url.searchParams.get('taskId') || body.taskId;
		const digits = body.Digits; // For user input via keypad
		const speechResult = body.SpeechResult; // For voice input
		
		console.log(`[${requestId}] Parsed request:`, {
			taskId,
			digits,
			speechResult,
			callSid: body.CallSid,
			callStatus: body.CallStatus,
			from: body.From,
			to: body.To,
			body
		});
	
		if (!taskId) {
			console.error(`[${requestId}] No task ID provided`);
			return new Response(errorTwiML('No task ID provided for this reminder'), {
				headers: {
					'Content-Type': 'text/xml',
					'Cache-Control': 'no-cache',
					'X-Request-ID': requestId,
					'X-Error-Type': 'missing-task-id',
					'X-Processing-Time': `${Date.now() - startTime}ms`
				}
			});
		}
		
		// Fetch task details from Supabase
		console.log(`[${requestId}] Fetching task with ID:`, taskId);
		console.log(`[${requestId}] Using service key:`, !!privateEnv.SUPABASE_SERVICE_ROLE_KEY);
		
		const { data: task, error } = await supabase
			.from('tasks')
			.select('*')
			.eq('id', taskId)
			.single();
		
		if (error) {
			logError(`[${requestId}] Supabase error fetching task`, error, {
				taskId,
				code: error.code,
				details: error.details
			});
			
			let errorMessage = "Sorry, I couldn't find the task details.";
			if (error.code === 'PGRST116') {
				errorMessage = "Task not found. It may have been deleted.";
			} else if (error.message?.includes('row-level')) {
				errorMessage = "Database permission error. Please check the configuration.";
			}
			
			return new Response(errorTwiML(errorMessage), {
				headers: {
					'Content-Type': 'text/xml',
					'Cache-Control': 'no-cache',
					'X-Request-ID': requestId,
					'X-Error-Type': 'database-error',
					'X-Processing-Time': `${Date.now() - startTime}ms`
				}
			});
		}
		
		if (!task) {
			console.error(`[${requestId}] No task found with ID:`, taskId);
			return new Response(errorTwiML("Sorry, I couldn't find that task. It may have been deleted."), {
				headers: {
					'Content-Type': 'text/xml',
					'Cache-Control': 'no-cache',
					'X-Request-ID': requestId,
					'X-Error-Type': 'task-not-found',
					'X-Processing-Time': `${Date.now() - startTime}ms`
				}
			});
		}
		
		console.log(`[${requestId}] Task found:`, { 
			id: task.id, 
			title: task.title, 
			status: task.status,
			phone_number: task.phone_number
		});
		
		// Handle user response (if any)
		if (digits || speechResult) {
			console.log(`[${requestId}] Handling user response:`, { digits, speechResult });
			return handleUserResponse(task, digits, speechResult, supabase, requestId, startTime);
		}
		
		// Generate personalized reminder message
		console.log(`[${requestId}] Generating reminder script...`);
		const reminderScript = await generateReminderScript(task, openai);
		console.log(`[${requestId}] Generated script:`, reminderScript);
		
		// Generate high-quality audio if OpenAI is available
		if (!openai) {
			console.log(`[${requestId}] Using fallback Twilio Say (no OpenAI key)`);
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
					'Cache-Control': 'no-cache',
					'X-Request-ID': requestId,
					'X-Processing-Time': `${Date.now() - startTime}ms`
				}
			});
		}
		
		try {
			console.log(`[${requestId}] Generating audio with OpenAI TTS...`);
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
			console.log(`[${requestId}] Audio generated and cached:`, { audioId, audioUrl, size: audioBuffer.length });
		
			// Return TwiML with audio and gather for user response
			const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather action="/api/voice/task-reminder?taskId=${taskId}" method="POST" numDigits="1" timeout="5">
    <Say voice="alice">Press 1 to mark complete, 2 to snooze for 10 minutes, or 3 to reschedule.</Say>
  </Gather>
  <Say voice="alice">Goodbye!</Say>
</Response>`;
			
			console.log(`[${requestId}] ✅ Success! Returning TwiML with audio. Processing time: ${Date.now() - startTime}ms`);
			
			return new Response(twiml, {
				headers: {
					'Content-Type': 'text/xml',
					'Cache-Control': 'no-cache',
					'X-Request-ID': requestId,
					'X-Processing-Time': `${Date.now() - startTime}ms`,
					'X-Audio-URL': audioUrl
				}
			});
			
		} catch (audioError: any) {
			logError(`[${requestId}] Audio generation failed`, audioError, { taskId });
			
			// Fallback to Twilio Say on audio generation failure
			console.log(`[${requestId}] Falling back to Twilio Say due to audio error`);
			const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! This is your task reminder: ${task.title}. Press 1 to mark complete, 2 to snooze for 10 minutes, or 3 to reschedule.</Say>
  <Gather action="/api/voice/task-reminder?taskId=${taskId}" method="POST" numDigits="1" timeout="5">
    <Pause length="2"/>
  </Gather>
  <Say voice="alice">Goodbye!</Say>
</Response>`;
			
			return new Response(fallbackTwiml, {
				headers: {
					'Content-Type': 'text/xml',
					'Cache-Control': 'no-cache',
					'X-Request-ID': requestId,
					'X-Error-Type': 'audio-generation-failed',
					'X-Processing-Time': `${Date.now() - startTime}ms`
				}
			});
		}
		
	} catch (error: any) {
		logError(`[${requestId}] Critical error in task reminder webhook`, error, {
			taskId,
			url: url.toString()
		});
		
		// Always return valid TwiML on any error
		const emergencyTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">This is your task reminder. Sorry, I'm having trouble accessing the full details right now. Please check your task list.</Say>
</Response>`;
		
		return new Response(emergencyTwiml, {
			headers: {
				'Content-Type': 'text/xml',
				'Cache-Control': 'no-cache',
				'X-Request-ID': requestId,
				'X-Error-Type': 'critical-error',
				'X-Processing-Time': `${Date.now() - startTime}ms`
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

async function handleUserResponse(task: any, digits: string, speechResult: string, supabase: any, requestId: string, startTime: number) {
	let action = '';
	
	if (digits === '1') {
		action = 'complete';
	} else if (digits === '2') {
		action = 'snooze';
	} else if (digits === '3') {
		action = 'reschedule';
	}
	
	console.log(`[${requestId}] User action for task ${task.id}: ${action}`);
	
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
		logError(`[${requestId}] Error updating task`, error, { taskId: task.id, action });
		responseMessage = "Sorry, I had trouble updating your task. Please try again later.";
	}
	
	const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${responseMessage}</Say>
</Response>`;
	
	return new Response(twiml, {
		headers: {
			'Content-Type': 'text/xml',
			'Cache-Control': 'no-cache',
			'X-Request-ID': requestId,
			'X-User-Action': action,
			'X-Processing-Time': `${Date.now() - startTime}ms`
		}
	});
}