import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServiceSupabaseClient } from '$lib/supabase-service';
import { env } from '$env/dynamic/private';

// Manual test endpoint for debugging cron job issues
export const GET: RequestHandler = async ({ url, fetch }) => {
	const verbose = url.searchParams.get('verbose') === 'true';
	const testCall = url.searchParams.get('call') === 'true';
	
	try {
		// Use service client to bypass RLS and see all tasks
		const supabase = createServiceSupabaseClient();
		const now = new Date();
		const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
		const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
		const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
		
		// Get various task statuses for debugging
		const queries = [
			{
				name: 'Due tasks (cron query)',
				query: supabase
					.from('tasks')
					.select('*')
					.in('status', ['pending'])
					.lte('scheduled_at', now.toISOString())
					.gte('scheduled_at', twoMinutesAgo.toISOString())
					.order('scheduled_at', { ascending: true })
			},
			{
				name: 'All pending tasks',
				query: supabase
					.from('tasks')
					.select('*')
					.eq('status', 'pending')
					.order('scheduled_at', { ascending: true })
					.limit(10)
			},
			{
				name: 'Stuck calling tasks',
				query: supabase
					.from('tasks')
					.select('*')
					.eq('status', 'calling')
					.lt('updated_at', fiveMinutesAgo.toISOString())
			},
			{
				name: 'Recent tasks (last hour)',
				query: supabase
					.from('tasks')
					.select('*')
					.gte('created_at', oneHourAgo.toISOString())
					.order('created_at', { descending: true })
					.limit(10)
			},
			{
				name: 'Failed tasks',
				query: supabase
					.from('tasks')
					.select('*')
					.eq('status', 'failed')
					.limit(10)
			}
		];
		
		const results: any = {
			timestamp: now.toISOString(),
			timezone: process.env.TZ || 'UTC',
			queryWindows: {
				cronWindow: {
					from: twoMinutesAgo.toISOString(),
					to: now.toISOString()
				},
				stuckWindow: {
					before: fiveMinutesAgo.toISOString()
				}
			},
			taskAnalysis: {}
		};
		
		// Execute all queries
		for (const { name, query } of queries) {
			const { data, error } = await query;
			
			if (error) {
				results.taskAnalysis[name] = {
					error: error.message,
					details: error
				};
			} else {
				results.taskAnalysis[name] = {
					count: data?.length || 0,
					tasks: verbose ? data : data?.map(t => ({
						id: t.id,
						title: t.title,
						status: t.status,
						scheduled_at: t.scheduled_at,
						created_at: t.created_at,
						updated_at: t.updated_at,
						retry_count: t.retry_count || 0,
						timeDiff: {
							fromNow: getTimeDiff(now, new Date(t.scheduled_at)),
							isOverdue: new Date(t.scheduled_at) < now
						}
					}))
				};
			}
		}
		
		// If requested, trigger the actual cron job
		if (testCall) {
			try {
				const response = await fetch('/api/cron/check-tasks?manual=true', {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${env.CRON_SECRET || ''}`,
					}
				});
				
				const cronResult = await response.json();
				results.cronExecution = cronResult;
			} catch (cronError: any) {
				results.cronExecution = {
					error: cronError.message
				};
			}
		}
		
		// Add environment check
		results.environment = {
			hasTwilioCredentials: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
			hasTwilioPhone: !!env.TWILIO_PHONE_NUMBER,
			hasSupabase: !!(process.env.PUBLIC_SUPABASE_URL && process.env.PUBLIC_SUPABASE_ANON_KEY),
			productionUrl: env.PRODUCTION_URL || 'not set',
			vercelUrl: env.VERCEL_URL || 'not set'
		};
		
		// Add helpful debugging info
		results.debugInfo = {
			info: 'Use ?verbose=true to see full task details',
			testCron: 'Use ?call=true to trigger the cron job',
			combineBoth: 'Use ?verbose=true&call=true for full debug'
		};
		
		return json(results);
		
	} catch (error: any) {
		return json({
			error: error.message,
			stack: error.stack,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};

function getTimeDiff(now: Date, taskTime: Date): string {
	const diff = taskTime.getTime() - now.getTime();
	const absDiff = Math.abs(diff);
	const minutes = Math.floor(absDiff / 60000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	
	let timeStr = '';
	if (days > 0) timeStr = `${days}d ${hours % 24}h`;
	else if (hours > 0) timeStr = `${hours}h ${minutes % 60}m`;
	else timeStr = `${minutes}m`;
	
	return diff < 0 ? `-${timeStr} (overdue)` : `+${timeStr}`;
}