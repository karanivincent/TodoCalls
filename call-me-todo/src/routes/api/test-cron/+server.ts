import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		// Manually trigger the cron job
		const response = await fetch('/api/cron/check-tasks', {
			method: 'GET',
			headers: {
				'x-vercel-cron': '1' // Simulate Vercel cron header
			}
		});
		
		const result = await response.json();
		
		return json({
			message: 'Cron job triggered manually',
			cronResult: result
		});
	} catch (error: any) {
		console.error('Error triggering cron:', error);
		return json({
			error: error.message || 'Failed to trigger cron job'
		}, { status: 500 });
	}
};