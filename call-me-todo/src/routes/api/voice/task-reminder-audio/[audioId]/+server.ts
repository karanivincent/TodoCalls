import type { RequestHandler } from './$types';

// Audio cache shared with task-reminder route
export const audioCache = new Map<string, Buffer>();

export const GET: RequestHandler = async ({ params }) => {
	const audioId = params.audioId;
	
	if (audioId && audioCache.has(audioId)) {
		const audioBuffer = audioCache.get(audioId)!;
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