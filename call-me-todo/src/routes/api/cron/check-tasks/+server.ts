import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseClient } from '$lib/supabase';
import twilio from 'twilio';
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } from '$env/static/private';

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Optional: Add authentication for cron job endpoint
		const authHeader = request.headers.get('authorization');
		if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			// return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const supabase = createSupabaseClient();
		
		// Get tasks that are due now (within the last minute)
		const now = new Date();
		const oneMinuteAgo = new Date(now.getTime() - 60000);
		
		const { data: dueTasks, error } = await supabase
			.from('tasks')
			.select('*')
			.eq('status', 'pending')
			.gte('scheduled_at', oneMinuteAgo.toISOString())
			.lte('scheduled_at', now.toISOString());

		if (error) {
			console.error('Error fetching due tasks:', error);
			return json({ error: error.message }, { status: 500 });
		}

		const results = [];
		
		// Initiate calls for each due task
		for (const task of dueTasks || []) {
			try {
				// Use the production URL for Vercel deployments
				const baseUrl = process.env.VERCEL_URL 
					? `https://${process.env.VERCEL_URL}`
					: 'https://telitask.com';
				
				const call = await twilioClient.calls.create({
					to: task.phone_number,
					from: TWILIO_PHONE_NUMBER,
					// Use the new task-reminder endpoint
					url: `${baseUrl}/api/voice/task-reminder?taskId=${task.id}`,
					method: 'POST',
					statusCallback: `${baseUrl}/api/voice/status`,
					statusCallbackMethod: 'POST',
					statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
				});

				// Update task status to indicate call was initiated
				await supabase
					.from('tasks')
					.update({ status: 'calling' })
					.eq('id', task.id);

				results.push({
					taskId: task.id,
					callSid: call.sid,
					status: 'initiated'
				});
			} catch (callError: any) {
				console.error(`Failed to call for task ${task.id}:`, callError);
				
				// Mark task as failed if call couldn't be initiated
				await supabase
					.from('tasks')
					.update({ status: 'failed' })
					.eq('id', task.id);
				
				results.push({
					taskId: task.id,
					error: callError.message,
					status: 'failed'
				});
			}
		}

		return json({
			success: true,
			tasksProcessed: dueTasks?.length || 0,
			results
		});
	} catch (error: any) {
		console.error('Cron job error:', error);
		return json({
			error: error.message || 'Cron job failed'
		}, { status: 500 });
	}
};