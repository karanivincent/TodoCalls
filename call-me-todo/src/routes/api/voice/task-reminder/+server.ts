import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { createServiceSupabaseClient } from '$lib/supabase-service';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

import { addAudioToCache } from '$lib/audio-cache';
import { parseTwilioRequest, errorTwiML, logError } from '$lib/twilio-utils';

// Handle GET requests from Twilio (for initial webhook validation or fallback)
export const GET: RequestHandler = async ({ url }) => {
	const taskId = url.searchParams.get('taskId');
	const requestId = Math.random().toString(36).substring(7);
	
	console.log(`📞 [${requestId}] GET request to task-reminder (Twilio validation?):`, {
		taskId,
		url: url.toString()
	});
	
	// Return a simple TwiML response for GET requests
	const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">This webhook requires a POST request with task details.</Say>
</Response>`;

	return new Response(twiml, {
		headers: {
			'Content-Type': 'text/xml',
			'Cache-Control': 'no-cache',
			'X-Request-ID': requestId
		}
	});
};

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
		// Initialize clients using service client for proper RLS bypass (same as cron job)
		console.log(`[${requestId}] Initializing service clients...`);
		
		const openaiKey = privateEnv.OPENAI_API_KEY;
		
		// Use service client to ensure proper database access
		let supabase;
		try {
			supabase = createServiceSupabaseClient();
			console.log(`[${requestId}] ✅ Service Supabase client created successfully`);
		} catch (supabaseError: any) {
			logError(`[${requestId}] Failed to create Supabase service client`, supabaseError);
			return new Response(errorTwiML('Database configuration error', true), {
				headers: {
					'Content-Type': 'text/xml',
					'Cache-Control': 'no-cache',
					'X-Request-ID': requestId,
					'X-Error-Type': 'supabase-client-creation'
				}
			});
		}

		// Log environment status for debugging
		console.log(`[${requestId}] Environment check:`, {
			hasServiceKey: !!privateEnv.SUPABASE_SERVICE_ROLE_KEY,
			hasOpenAIKey: !!openaiKey,
			publicSupabaseUrl: publicEnv.PUBLIC_SUPABASE_URL || 'MISSING'
		});

		if (!openaiKey) {
			console.warn(`[${requestId}] Missing OpenAI API key - will use fallback voice`);
		}

		// Create OpenAI client
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
			console.error(`[${requestId}] Debug - Available query params:`, Object.fromEntries(url.searchParams));
			console.error(`[${requestId}] Debug - Available body data:`, body);
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
		
		// Fetch task details from Supabase with enhanced debugging
		console.log(`[${requestId}] Fetching task with ID:`, taskId);
		console.log(`[${requestId}] Using service client with service key:`, !!privateEnv.SUPABASE_SERVICE_ROLE_KEY);
		
		let task, error;
		try {
			const result = await supabase
				.from('tasks')
				.select('*')
				.eq('id', taskId)
				.single();
			
			task = result.data;
			error = result.error;
			
			console.log(`[${requestId}] Database query result:`, {
				success: !error,
				hasTask: !!task,
				taskId: task?.id,
				taskTitle: task?.title?.substring(0, 50),
				taskStatus: task?.status,
				errorCode: error?.code,
				errorMessage: error?.message
			});
		} catch (queryError: any) {
			console.error(`[${requestId}] Database query exception:`, queryError);
			error = queryError;
		}
		
		if (error) {
			logError(`[${requestId}] Supabase error fetching task`, error, {
				taskId,
				code: error.code,
				details: error.details
			});
			
			console.error(`[${requestId}] 🔍 DEBUG: Supabase query failed for taskId: ${taskId}`);
			console.error(`[${requestId}] 🔍 DEBUG: Error code: ${error.code}, Message: ${error.message}`);
			console.error(`[${requestId}] 🔍 DEBUG: Using service key: ${!!privateEnv.SUPABASE_SERVICE_ROLE_KEY}`);
			
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
			console.error(`[${requestId}] 🔍 DEBUG: No task found with ID: ${taskId}`);
			console.error(`[${requestId}] 🔍 DEBUG: Query returned data:`, task);
			console.error(`[${requestId}] 🔍 DEBUG: This suggests the task doesn't exist or RLS is blocking access`);
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
		console.log(`🎵 [SCRIPT] [${requestId}] Generating reminder script with OpenAI...`);
		const reminderScript = await generateReminderScript(task, openai);
		console.log(`🎵 [SCRIPT] [${requestId}] ✅ Generated script (${reminderScript.length} chars):`, reminderScript.substring(0, 100) + '...');
		
		// Generate high-quality audio if OpenAI is available
		if (!openai) {
			console.log(`[${requestId}] Using enhanced fallback Twilio Say (no OpenAI key)`);
			// Enhanced fallback to Twilio Say if OpenAI is not available
			const fallbackScript = await generateReminderScript(task, null);
			const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${fallbackScript}</Say>
  <Gather action="/api/voice/task-reminder?taskId=${taskId}" method="POST" numDigits="1" timeout="8" speechTimeout="3" input="dtmf speech">
    <Say voice="alice">You can press 1 to mark it complete, 2 to snooze for 10 minutes, 3 to reschedule, or just tell me what you'd like to do.</Say>
    <Pause length="3"/>
  </Gather>
  <Say voice="alice">No response received. Your task remains scheduled. Have a productive day!</Say>
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
			console.log(`🎵 [AUDIO] [${requestId}] Calling OpenAI TTS API...`, {
				model: 'tts-1-hd',
				voice: 'nova',
				scriptLength: reminderScript.length,
				scriptPreview: reminderScript.substring(0, 100)
			});
			
			const mp3Response = await openai.audio.speech.create({
				model: 'tts-1-hd',
				voice: 'nova',
				input: reminderScript,
				response_format: 'mp3',
				speed: 1.0
			});
			
			console.log(`🎵 [AUDIO] [${requestId}] ✅ OpenAI TTS response received, converting to buffer...`);
			
			// Convert to buffer and cache
			const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
			const audioId = `audio_${taskId}_${Date.now()}`;
			console.log(`🎵 [AUDIO] [${requestId}] Converting to buffer (${audioBuffer.length} bytes)...`);
			
			addAudioToCache(audioId, audioBuffer);
			console.log(`🎵 [AUDIO] [${requestId}] ✅ Audio cached with ID: ${audioId}`);
			
			// Use the dedicated audio serving route with fallback protection
			const audioUrl = `${url.origin}/api/voice/task-reminder-audio/${audioId}`;
			console.log(`🎵 [AUDIO] [${requestId}] ✅ Audio URL generated:`, audioUrl);
			
			// Audio URL should be accessible since we just cached it
			const useAudioUrl = true;
		
			// Return TwiML with audio and enhanced gather for user response (with fallback)
			const twiml = useAudioUrl ? 
				`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather action="/api/voice/task-reminder?taskId=${taskId}" method="POST" numDigits="1" timeout="8" speechTimeout="3" input="dtmf speech">
    <Say voice="alice">You can press 1 to mark it complete, 2 to snooze for 10 minutes, 3 to reschedule, or just tell me what you'd like to do.</Say>
    <Pause length="3"/>
  </Gather>
  <Say voice="alice">No response received. Your task remains scheduled. Have a productive day!</Say>
</Response>` :
				`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${reminderScript}</Say>
  <Gather action="/api/voice/task-reminder?taskId=${taskId}" method="POST" numDigits="1" timeout="8" speechTimeout="3" input="dtmf speech">
    <Say voice="alice">You can press 1 to mark it complete, 2 to snooze for 10 minutes, 3 to reschedule, or just tell me what you'd like to do.</Say>
    <Pause length="3"/>
  </Gather>
  <Say voice="alice">No response received. Your task remains scheduled. Have a productive day!</Say>
</Response>`;
			
			console.log(`📋 [TWIML] [${requestId}] ✅ Success! Returning TwiML with audio. Processing time: ${Date.now() - startTime}ms`);
			console.log(`📋 [TWIML] [${requestId}] TwiML content:`, twiml.substring(0, 200) + '...');
			
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
			
			// Enhanced fallback to Twilio Say on audio generation failure
			console.log(`[${requestId}] Falling back to enhanced Twilio Say due to audio error`);
			const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${reminderScript}</Say>
  <Gather action="/api/voice/task-reminder?taskId=${taskId}" method="POST" numDigits="1" timeout="8" speechTimeout="3" input="dtmf speech">
    <Say voice="alice">You can press 1 to mark it complete, 2 to snooze for 10 minutes, 3 to reschedule, or just tell me what you'd like to do.</Say>
    <Pause length="3"/>
  </Gather>
  <Say voice="alice">No response received. Your task remains scheduled. Have a productive day!</Say>
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
		const taskIdForError = url.searchParams.get('taskId');
		
		// Enhanced error logging with more context
		logError(`[${requestId}] Critical error in task reminder webhook`, error, {
			taskId: taskIdForError,
			url: url.toString(),
			errorType: error?.constructor?.name,
			errorCode: error?.code,
			errorStack: error?.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
			hasOpenAI: !!privateEnv.OPENAI_API_KEY,
			hasServiceKey: !!privateEnv.SUPABASE_SERVICE_ROLE_KEY
		});
		
		console.error(`[${requestId}] 🚨 WEBHOOK FAILURE ANALYSIS:`, {
			step: 'Unknown - caught in outer catch',
			taskId: taskIdForError,
			errorMessage: error?.message,
			possibleCauses: [
				'Database client creation failed',
				'Task query failed (RLS/permissions)',
				'OpenAI script generation failed', 
				'Audio generation/caching failed',
				'TwiML generation failed'
			]
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
	
	// Enhanced fallback for no OpenAI
	if (!openai) {
		return `Hi! Good ${timeOfDay}. This is Nova calling with your reminder about: ${task.title}. 
		I'm here to help you stay organized and on track with your goals.`;
	}
	
	try {
		// Enhanced conversational prompt with more context
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content: `You are Nova, an AI assistant powered by artificial intelligence, making a friendly reminder call. 

					IMPORTANT: Always disclose that you are an AI assistant at the beginning of the call.
					
					Your personality:
					- Warm, encouraging, and supportive
					- Professional yet conversational
					- Empathetic to user's productivity challenges
					- Brief but engaging (aim for 30-40 words total)
					
					Call structure:
					1. Greeting with AI disclosure
					2. Reminder about their task
					3. Brief encouragement or context
					4. Clear instruction about response options
					
					Time context: It's currently ${timeOfDay}.
					
					Always end with clear instructions about how they can respond - either by pressing numbers on their keypad OR speaking their choice aloud.`
				},
				{
					role: 'user',
					content: `Create a personalized reminder message for this task: "${task.title}"`
				}
			],
			max_tokens: 200,
			temperature: 0.8
		});
		
		const script = completion.choices[0].message.content || 
			`Hi! This is Nova, your AI assistant. Good ${timeOfDay}! I'm calling to remind you about: ${task.title}.`;
		
		// Ensure the script mentions response options
		const hasResponseMention = script.toLowerCase().includes('press') || 
			script.toLowerCase().includes('key') || 
			script.toLowerCase().includes('speak') ||
			script.toLowerCase().includes('say');
		
		if (!hasResponseMention) {
			return `${script} You can press 1 to mark it complete, 2 to snooze for 10 minutes, 3 to reschedule for later, or just tell me what you'd like to do.`;
		}
		
		return script;
	} catch (error) {
		console.error('Error generating script:', error);
		return `Hi! This is Nova, your AI assistant. Good ${timeOfDay}! I'm calling to remind you about: ${task.title}. I'm here to help you stay organized and productive.`;
	}
}

async function handleUserResponse(task: any, digits: string, speechResult: string, supabase: any, requestId: string, startTime: number) {
	let action = '';
	let responseMethod = '';
	
	// Handle DTMF input (keypad)
	if (digits === '1') {
		action = 'complete';
		responseMethod = 'keypad';
	} else if (digits === '2') {
		action = 'snooze';
		responseMethod = 'keypad';
	} else if (digits === '3') {
		action = 'reschedule';
		responseMethod = 'keypad';
	}
	
	// Handle speech input with natural language processing
	if (!action && speechResult) {
		responseMethod = 'speech';
		const speech = speechResult.toLowerCase().trim();
		
		// Complete variations
		if (speech.includes('complete') || speech.includes('done') || speech.includes('finished') || 
			speech.includes('finish') || speech.includes('mark complete') || speech.includes('completed')) {
			action = 'complete';
		}
		// Snooze variations
		else if (speech.includes('snooze') || speech.includes('remind me later') || 
				 speech.includes('10 minutes') || speech.includes('ten minutes') ||
				 speech.includes('later') || speech.includes('few minutes')) {
			action = 'snooze';
		}
		// Reschedule variations
		else if (speech.includes('reschedule') || speech.includes('different time') ||
				 speech.includes('hour') || speech.includes('tomorrow') ||
				 speech.includes('postpone') || speech.includes('delay')) {
			action = 'reschedule';
		}
		// Cancel/ignore variations
		else if (speech.includes('cancel') || speech.includes('ignore') ||
				 speech.includes('delete') || speech.includes('remove') ||
				 speech.includes('not now') || speech.includes('skip')) {
			action = 'cancel';
		}
	}
	
	console.log(`[${requestId}] User response for task ${task.id}:`, { 
		action, 
		responseMethod, 
		digits, 
		speechResult: speechResult?.substring(0, 100) 
	});
	
	let responseMessage = '';
	
	// Generate varied, encouraging responses
	const encouragingMessages = {
		complete: [
			"Fantastic! I've marked your task as complete. You're crushing your goals today!",
			"Excellent work! Task marked as done. Keep that momentum going!",
			"Amazing! I've updated your task to complete. You're doing great!",
			"Perfect! Task completed and logged. Your productivity is inspiring!",
			"Outstanding! I've marked that as finished. Way to stay on top of things!"
		],
		snooze: [
			"No worries! I'll give you a gentle nudge in 10 minutes. You've got this!",
			"Absolutely! Taking a quick 10-minute break. I'll check back with you soon!",
			"Sure thing! I'll remind you again in 10 minutes. Stay focused!",
			"Of course! 10-minute snooze activated. I'll be back to help you tackle this!",
			"Perfect timing! I'll circle back in 10 minutes. Keep up the great work!"
		],
		reschedule: [
			"Smart choice! I've moved this to one hour from now. Planning ahead is key!",
			"Great thinking! Rescheduled for one hour later. I'll call you then!",
			"Wise decision! I've pushed this back an hour. Better timing coming up!",
			"Excellent planning! Task moved to one hour from now. I'll be in touch!",
			"Good call! Rescheduled for later today. I'll remind you at the perfect time!"
		],
		cancel: [
			"Understood! I've noted that you'd like to skip this reminder. Task remains as is.",
			"Got it! No action taken on this task. It will stay on your list for now.",
			"Noted! I'll leave this task unchanged. You know what works best for you!",
			"Perfectly fine! This reminder is dismissed, but the task stays active.",
			"Absolutely! Sometimes timing isn't right. The task remains in your queue."
		]
	};
	
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
			
			const messages = encouragingMessages.complete;
			responseMessage = messages[Math.floor(Math.random() * messages.length)];
			
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
			
			const messages = encouragingMessages.snooze;
			responseMessage = messages[Math.floor(Math.random() * messages.length)];
			
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
			
			const messages = encouragingMessages.reschedule;
			responseMessage = messages[Math.floor(Math.random() * messages.length)];
			
		} else if (action === 'cancel') {
			const messages = encouragingMessages.cancel;
			responseMessage = messages[Math.floor(Math.random() * messages.length)];
			
		} else {
			// Handle unclear responses more gracefully
			const method = responseMethod === 'speech' ? 'what you said' : 'that input';
			responseMessage = `I didn't quite catch ${method}. Your task "${task.title}" remains scheduled. You can press 1 to complete, 2 to snooze, or 3 to reschedule. Have a great day!`;
		}
		
	} catch (error) {
		logError(`[${requestId}] Error updating task`, error, { taskId: task.id, action });
		responseMessage = "I apologize, but I had trouble updating your task. Please try again later, or manage it through your dashboard. Thanks for your patience!";
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