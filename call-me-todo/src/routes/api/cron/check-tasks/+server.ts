import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServiceSupabaseClient } from '$lib/supabase-service';
import { initiateTaskCall } from '$lib/call-initiation';
import { env } from '$env/dynamic/private';

// Vercel cron jobs use GET requests
export const GET: RequestHandler = async ({ request, url }) => {
	const startTime = Date.now();
	const now = new Date();
	const requestId = Math.random().toString(36).substring(7);
	
	try {
		console.log('========================================');
		console.log('CRON JOB STARTED:', {
			time: now.toISOString(),
			timezone: process.env.TZ || 'UTC',
			url: url.toString()
		});
		
		// Twilio client now handled by shared function
		
		// Vercel cron jobs include a special header
		const isVercelCron = request.headers.get('x-vercel-cron') === '1';
		const isManualTrigger = url.searchParams.get('manual') === 'true';
		
		console.log('Trigger source:', {
			isVercelCron,
			isManualTrigger,
			headers: Object.fromEntries(request.headers.entries())
		});
		
		if (!isVercelCron && !isManualTrigger) {
			// Optional: Add authentication for manual triggers
			const authHeader = request.headers.get('authorization');
			if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
				console.log('Unauthorized cron request');
				// Uncomment to enforce auth: return json({ error: 'Unauthorized' }, { status: 401 });
			}
		}

		// Use service client to bypass RLS for system operations
		const supabase = createServiceSupabaseClient();
		
		// Increase time window to 2 minutes to handle any timing discrepancies
		const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
		const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
		
		console.log('Query window:', {
			from: twoMinutesAgo.toISOString(),
			to: now.toISOString(),
			stuckCallsFrom: fiveMinutesAgo.toISOString()
		});
		
		// First, reset any stuck 'calling' tasks
		const { data: stuckTasks, error: stuckError } = await supabase
			.from('tasks')
			.update({ 
				status: 'pending',
				retry_count: 0 // Reset retry count
			})
			.eq('status', 'calling')
			.lt('updated_at', fiveMinutesAgo.toISOString())
			.select();
		
		if (stuckTasks?.length) {
			console.log(`Reset ${stuckTasks.length} stuck tasks back to pending`);
		}
		
		// Get tasks that are due (including recently failed ones)
		const { data: dueTasks, error } = await supabase
			.from('tasks')
			.select('*')
			.in('status', ['pending']) // Only pending tasks (stuck ones were reset above)
			.lte('scheduled_at', now.toISOString()) // All tasks due by now
			.gte('scheduled_at', twoMinutesAgo.toISOString()) // Within last 2 minutes
			.order('scheduled_at', { ascending: true }); // Process oldest first

		if (error) {
			console.error('Error fetching due tasks:', error);
			return json({ 
				error: error.message,
				details: error.details,
				hint: error.hint
			}, { status: 500 });
		}

		console.log(`Found ${dueTasks?.length || 0} due tasks`);
		if (dueTasks?.length) {
			console.log('Due tasks:', dueTasks.map(t => ({
				id: t.id,
				title: t.title,
				scheduled_at: t.scheduled_at,
				status: t.status,
				retry_count: t.retry_count || 0
			})));
		}
		
		const results = [];
		
		// Get the correct base URL
		const baseUrl = env.PRODUCTION_URL || 
			(env.VERCEL_URL ? `https://${env.VERCEL_URL}` : null) ||
			'https://telitask.com';
		
		console.log('Using base URL:', baseUrl);
		console.log('Twilio phone number:', env.TWILIO_PHONE_NUMBER);
		
		// Initiate calls for each due task
		for (const task of dueTasks || []) {
			console.log(`Processing task ${task.id}: ${task.title}`);
			
			// Check retry count (max 3 attempts)
			if ((task.retry_count || 0) >= 3) {
				console.log(`Task ${task.id} exceeded max retries, marking as failed`);
				await supabase
					.from('tasks')
					.update({ status: 'failed' })
					.eq('id', task.id);
				
				results.push({
					taskId: task.id,
					status: 'max_retries_exceeded'
				});
				continue;
			}
			
			try {
				// Update task status to 'calling' BEFORE making the call
				const { error: updateError } = await supabase
					.from('tasks')
					.update({ 
						status: 'calling',
						last_call_attempt: now.toISOString(),
						retry_count: (task.retry_count || 0) + 1
					})
					.eq('id', task.id);
				
				if (updateError) {
					console.error(`Failed to update task ${task.id} status:`, updateError);
					// If we can't update the status, skip this task to avoid duplicate calls
					continue;
				}
				
				console.log(`Initiating call for task ${task.id} to ${task.phone_number}`);
				
				// Use shared call initiation function
				const callResult = await initiateTaskCall(task.id, supabase, {
					baseUrl,
					timeout: 30,
					requestId: `cron-${requestId}-${task.id}`
				});

				if (callResult.success) {
					console.log(`Call initiated successfully:`, {
						taskId: task.id,
						callSid: callResult.callSid,
						phoneNumber: callResult.phoneNumber
					});

					results.push({
						taskId: task.id,
						callSid: callResult.callSid,
						status: 'initiated',
						phoneNumber: callResult.phoneNumber
					});
				} else {
					throw new Error(callResult.error || 'Call initiation failed');
				}
				
			} catch (callError: any) {
				console.error(`Failed to call for task ${task.id}:`, {
					error: callError.message,
					code: callError.code,
					moreInfo: callError.moreInfo
				});
				
				// Reset task to pending for retry in next cron run
				await supabase
					.from('tasks')
					.update({ 
						status: 'pending',
						// Keep the retry count
					})
					.eq('id', task.id);
				
				results.push({
					taskId: task.id,
					error: callError.message,
					code: callError.code,
					status: 'call_failed'
				});
			}
		}

		const executionTime = Date.now() - startTime;
		console.log('CRON JOB COMPLETED:', {
			executionTime: `${executionTime}ms`,
			tasksProcessed: dueTasks?.length || 0,
			callsInitiated: results.filter(r => r.status === 'initiated').length,
			callsFailed: results.filter(r => r.status === 'call_failed').length
		});
		console.log('========================================');

		return json({
			success: true,
			time: now.toISOString(),
			tasksProcessed: dueTasks?.length || 0,
			results,
			executionTime: `${executionTime}ms`,
			baseUrl
		});
		
	} catch (error: any) {
		console.error('CRON JOB CRITICAL ERROR:', error);
		return json({
			error: error.message || 'Cron job failed',
			stack: error.stack,
			time: now.toISOString()
		}, { status: 500 });
	}
};

// Also support POST for manual triggering
export const POST = GET;