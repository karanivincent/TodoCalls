import type { RequestHandler } from './$types';
import { getAudioFromCache, hasAudio } from '$lib/audio-cache';

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
	
	console.log(`🎵 [AUDIO-SERVE] [${requestId}] Looking up audio in cache...`);
	
	if (!hasAudio(audioId)) {
		console.error(`🎵 [AUDIO-SERVE] [${requestId}] ❌ Audio not found in cache for ID: ${audioId}`);
		return new Response('Audio not found', { status: 404 });
	}
	
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
};