import type { RequestHandler } from './$types';
import { getAudioFromCache, hasAudio } from '$lib/audio-cache';

export const GET: RequestHandler = async ({ params }) => {
	const audioId = params.audioId;
	
	if (audioId && hasAudio(audioId)) {
		const audioBuffer = getAudioFromCache(audioId)!;
		console.log(`Serving audio ${audioId}`);
		
		return new Response(audioBuffer, {
			headers: {
				'Content-Type': 'audio/mpeg',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	}
	
	return new Response('Audio not found', { status: 404 });
};