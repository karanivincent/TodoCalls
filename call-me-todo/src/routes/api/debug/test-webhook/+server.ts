import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServiceSupabaseClient } from '$lib/supabase-service';

export const POST: RequestHandler = async ({ request }) => {
	const { taskId } = await request.json();
	
	if (!taskId) {
		return json({ error: 'taskId required' }, { status: 400 });
	}
	
	console.log('🔍 DEBUG: Testing webhook flow with taskId:', taskId);
	
	try {
		// Test service client creation
		const supabase = createServiceSupabaseClient();
		console.log('✅ Service client created successfully');
		
		// Test task retrieval
		const { data: task, error } = await supabase
			.from('tasks')
			.select('*')
			.eq('id', taskId)
			.single();
		
		if (error) {
			console.error('❌ Task query failed:', error);
			return json({
				success: false,
				step: 'task_query',
				error: error.message,
				code: error.code,
				details: error.details
			});
		}
		
		if (!task) {
			console.error('❌ No task found');
			return json({
				success: false,
				step: 'task_not_found',
				taskId
			});
		}
		
		console.log('✅ Task found:', {
			id: task.id,
			title: task.title,
			status: task.status,
			phone: task.phone_number
		});
		
		// Test webhook URL construction
		const baseUrl = 'https://telitask.com';
		const webhookUrl = `${baseUrl}/api/voice/task-reminder?taskId=${taskId}`;
		
		console.log('🔗 Webhook URL that would be called:', webhookUrl);
		
		return json({
			success: true,
			task: {
				id: task.id,
				title: task.title,
				status: task.status,
				phone_number: task.phone_number,
				scheduled_at: task.scheduled_at
			},
			webhookUrl,
			message: 'Task retrieval successful - webhook should work'
		});
		
	} catch (error: any) {
		console.error('❌ Critical error in debug test:', error);
		return json({
			success: false,
			step: 'critical_error',
			error: error.message,
			stack: error.stack?.split('\n').slice(0, 3)
		}, { status: 500 });
	}
};