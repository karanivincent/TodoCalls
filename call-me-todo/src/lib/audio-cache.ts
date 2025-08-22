// Shared audio cache for voice endpoints
const audioCache = new Map<string, Buffer>();

export function addAudioToCache(audioId: string, audioBuffer: Buffer) {
	audioCache.set(audioId, audioBuffer);
	// Auto-cleanup after 5 minutes
	setTimeout(() => audioCache.delete(audioId), 300000);
}

export function getAudioFromCache(audioId: string): Buffer | undefined {
	return audioCache.get(audioId);
}

export function hasAudio(audioId: string): boolean {
	return audioCache.has(audioId);
}