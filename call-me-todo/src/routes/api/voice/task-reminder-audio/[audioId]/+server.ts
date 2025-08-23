import type { RequestHandler } from './$types';
import { getAudioFromCache, hasAudio } from '$lib/audio-cache';

export const GET: RequestHandler = async ({ params }) => {
	const audioId = params.audioId;
	const requestId = Math.random().toString(36).substring(7);
	
	console.log(`🎵 [AUDIO-SERVE] [${requestId}] ===== TWILIO REQUESTING AUDIO =====`);
	console.log(`🎵 [AUDIO-SERVE] [${requestId}] Requested audioId:`, audioId);
	
	if (audioId && hasAudio(audioId)) {
		const audioBuffer = getAudioFromCache(audioId)!;
		console.log(`🎵 [AUDIO-SERVE] [${requestId}] ✅ Audio found! Serving ${audioBuffer.length} bytes`);
		
		return new Response(audioBuffer, {
			headers: {
				'Content-Type': 'audio/mpeg',
				'Cache-Control': 'public, max-age=3600',
				'Content-Length': audioBuffer.length.toString(),
				'X-Request-ID': requestId
			}
		});
	}
	
	console.error(`🎵 [AUDIO-SERVE] [${requestId}] ❌ Audio not found for ID: ${audioId}`);
	return new Response('Audio not found', { status: 404 });
};