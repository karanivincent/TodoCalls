import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { createServiceSupabaseClient } from '$lib/supabase-service';
import { env as privateEnv } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const audioId = url.searchParams.get('id');
	const requestId = Math.random().toString(36).substring(7);
	
	console.log(`🎵 [AUDIO-SERVE] [${requestId}] ===== TWILIO REQUESTING AUDIO =====`);
	console.log(`🎵 [AUDIO-SERVE] [${requestId}] Requested audioId:`, audioId);
	console.log(`🎵 [AUDIO-SERVE] [${requestId}] Full URL:`, url.toString());
	
	if (!audioId) {
		console.error(`🎵 [AUDIO-SERVE] [${requestId}] ❌ No audio ID provided in query params`);
		return new Response('Audio ID required in query parameter', { status: 400 });
	}
	
	// Extract task ID from audio ID format: audio_taskId_timestamp
	const taskId = audioId.replace(/^audio_/, '').replace(/_\d+$/, '');
	console.log(`🎵 [AUDIO-SERVE] [${requestId}] Extracted taskId:`, taskId);
	
	if (!taskId) {
		console.error(`🎵 [AUDIO-SERVE] [${requestId}] ❌ Could not extract task ID from audioId:`, audioId);
		return new Response('Invalid audio ID format', { status: 400 });
	}
	
	try {
		// Get task details from database
		console.log(`🎵 [AUDIO-SERVE] [${requestId}] Fetching task details...`);
		const supabase = createServiceSupabaseClient();
		const { data: task, error } = await supabase
			.from('tasks')
			.select('*')
			.eq('id', taskId)
			.single();
		
		if (error || !task) {
			console.error(`🎵 [AUDIO-SERVE] [${requestId}] ❌ Task not found:`, error);
			return new Response('Task not found', { status: 404 });
		}
		
		console.log(`🎵 [AUDIO-SERVE] [${requestId}] Task found:`, { id: task.id, title: task.title });
		
		// Generate audio using OpenAI
		const openaiKey = privateEnv.OPENAI_API_KEY;
		if (!openaiKey) {
			console.error(`🎵 [AUDIO-SERVE] [${requestId}] ❌ No OpenAI API key available`);
			return new Response('Audio generation not available', { status: 503 });
		}
		
		console.log(`🎵 [AUDIO-SERVE] [${requestId}] Generating audio script...`);
		const reminderScript = await generateReminderScript(task);
		console.log(`🎵 [AUDIO-SERVE] [${requestId}] Script generated (${reminderScript.length} chars)`);
		
		console.log(`🎵 [AUDIO-SERVE] [${requestId}] Calling OpenAI TTS API...`);
		const openai = new OpenAI({ apiKey: openaiKey });
		const mp3Response = await openai.audio.speech.create({
			model: 'tts-1-hd',
			voice: 'nova',
			input: reminderScript,
			response_format: 'mp3',
			speed: 1.0
		});
		
		console.log(`🎵 [AUDIO-SERVE] [${requestId}] ✅ OpenAI TTS response received, converting to buffer...`);
		const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
		console.log(`🎵 [AUDIO-SERVE] [${requestId}] ✅ Audio generated! Serving ${audioBuffer.length} bytes`);
		
		return new Response(audioBuffer, {
			headers: {
				'Content-Type': 'audio/mpeg',
				'Cache-Control': 'public, max-age=300', // 5 minutes cache
				'Content-Length': audioBuffer.length.toString(),
				'X-Request-ID': requestId,
				'X-Generated-For': taskId
			}
		});
		
	} catch (error: any) {
		console.error(`🎵 [AUDIO-SERVE] [${requestId}] ❌ Error generating audio:`, error);
		return new Response('Error generating audio', { status: 500 });
	}
};

async function generateReminderScript(task: any): Promise<string> {
	const now = new Date();
	const timeOfDay = now.getHours() < 12 ? 'morning' : 
					   now.getHours() < 17 ? 'afternoon' : 'evening';
	
	// Simple script generation for audio endpoint
	return `Hi! This is Nova, your AI assistant. Good ${timeOfDay}! I'm calling to remind you about: ${task.title}. I'm here to help you stay organized and productive.`;
}