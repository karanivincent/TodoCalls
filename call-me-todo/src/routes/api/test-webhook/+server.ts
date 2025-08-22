import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Test endpoint to verify webhook accessibility
export const GET: RequestHandler = async ({ url }) => {
	const testTaskId = url.searchParams.get('taskId') || 'test-task-id';
	
	try {
		// Test calling the task-reminder webhook
		const baseUrl = url.origin;
		const webhookUrl = `${baseUrl}/api/voice/task-reminder?taskId=${testTaskId}`;
		
		console.log('Testing webhook:', webhookUrl);
		
		// Make a test POST request to the webhook
		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				CallSid: 'TEST123',
				AccountSid: 'TEST_ACCOUNT',
				From: '+1234567890',
				To: '+0987654321',
				taskId: testTaskId
			})
		});
		
		const responseText = await response.text();
		const responseHeaders = Object.fromEntries(response.headers.entries());
		
		// Check if response is valid TwiML
		const isValidTwiML = responseText.includes('<?xml') && responseText.includes('<Response');
		
		return json({
			webhook: {
				url: webhookUrl,
				accessible: response.ok,
				status: response.status,
				statusText: response.statusText
			},
			response: {
				headers: responseHeaders,
				body: responseText,
				isValidTwiML
			},
			debug: {
				environment: {
					hasSupabaseUrl: !!process.env.PUBLIC_SUPABASE_URL,
					hasSupabaseKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY),
					hasOpenAI: !!process.env.OPENAI_API_KEY,
					hasTwilio: !!process.env.TWILIO_ACCOUNT_SID
				},
				suggestion: !isValidTwiML ? 'Check Vercel function logs for errors' : 'Webhook is returning valid TwiML'
			}
		});
		
	} catch (error: any) {
		return json({
			error: error.message,
			stack: error.stack,
			suggestion: 'The webhook endpoint might not be deployed or accessible'
		}, { status: 500 });
	}
};

// Also support POST
export const POST = GET;