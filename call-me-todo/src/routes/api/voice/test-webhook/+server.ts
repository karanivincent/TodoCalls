import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

/**
 * Test endpoint to simulate Twilio webhook calls for debugging
 * This helps us test different scenarios without making actual calls
 */

export const GET: RequestHandler = async ({ url }) => {
	return json({
		message: 'Test webhook endpoint',
		usage: {
			testCall: '/api/voice/test-webhook?action=call&taskId=test-123',
			testStatus: '/api/voice/test-webhook?action=status&callSid=CA123',
			testError: '/api/voice/test-webhook?action=error'
		}
	});
};

export const POST: RequestHandler = async ({ url, fetch }) => {
	const action = url.searchParams.get('action') || 'call';
	const taskId = url.searchParams.get('taskId') || 'test-task-123';
	const baseUrl = url.origin;
	
	console.log('🧪 Test webhook simulation:', { action, taskId, baseUrl });
	
	try {
		let response;
		let testBody;
		
		switch (action) {
			case 'call':
				// Simulate initial call webhook
				testBody = new URLSearchParams({
					CallSid: `CA${Math.random().toString(36).substring(7)}`,
					AccountSid: 'ACtest123',
					From: '+1234567890',
					To: '+0987654321',
					CallStatus: 'ringing',
					Direction: 'outbound-api'
				});
				
				response = await fetch(`${baseUrl}/api/voice/task-reminder?taskId=${taskId}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'X-Test-Request': 'true'
					},
					body: testBody
				});
				break;
				
			case 'status':
				// Simulate status callback
				testBody = new URLSearchParams({
					CallSid: url.searchParams.get('callSid') || 'CAtest123',
					CallStatus: 'completed',
					CallDuration: '45',
					From: '+1234567890',
					To: '+0987654321'
				});
				
				response = await fetch(`${baseUrl}/api/voice/status?taskId=${taskId}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'X-Test-Request': 'true'
					},
					body: testBody
				});
				break;
				
			case 'error':
				// Simulate error scenario with multipart form data
				response = await fetch(`${baseUrl}/api/voice/task-reminder?taskId=${taskId}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'multipart/form-data; boundary=test',
						'X-Test-Request': 'true'
					},
					body: '--test\r\nContent-Disposition: form-data; name="CallSid"\r\n\r\nCAerror\r\n--test--'
				});
				break;
				
			case 'digit':
				// Simulate user pressing a digit
				testBody = new URLSearchParams({
					CallSid: 'CAtest123',
					Digits: '1',
					From: '+1234567890',
					To: '+0987654321'
				});
				
				response = await fetch(`${baseUrl}/api/voice/task-reminder?taskId=${taskId}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'X-Test-Request': 'true'
					},
					body: testBody
				});
				break;
				
			default:
				return json({ error: 'Unknown action' }, { status: 400 });
		}
		
		const responseText = await response.text();
		const responseHeaders = Object.fromEntries(response.headers.entries());
		
		// Check if response is valid TwiML
		const isValidTwiML = responseText.includes('<?xml') && responseText.includes('<Response');
		const hasError = responseText.includes('<Say') && responseText.includes('error');
		
		return json({
			test: {
				action,
				taskId,
				timestamp: new Date().toISOString()
			},
			response: {
				status: response.status,
				statusText: response.statusText,
				headers: responseHeaders,
				body: responseText,
				isValidTwiML,
				hasError
			},
			analysis: {
				success: response.status === 200 && isValidTwiML,
				warnings: [
					!isValidTwiML && 'Response is not valid TwiML',
					response.status !== 200 && `HTTP status ${response.status}`,
					hasError && 'Response contains error message',
					!responseHeaders['x-request-id'] && 'Missing request ID header'
				].filter(Boolean)
			}
		});
		
	} catch (error: any) {
		console.error('Test webhook error:', error);
		return json({
			error: error.message,
			stack: error.stack
		}, { status: 500 });
	}
};