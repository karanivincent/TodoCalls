import type { RequestHandler } from './$types';
import { parseTwilioRequest, logError } from '$lib/twilio-utils';

export const POST: RequestHandler = async ({ request, url }) => {
	const requestId = Math.random().toString(36).substring(7);
	const startTime = Date.now();
	
	console.log(`📞 [${requestId}] Status webhook called:`, {
		method: request.method,
		url: url.toString(),
		headers: Object.fromEntries(request.headers.entries()),
		timestamp: new Date().toISOString()
	});
	
	try {
		// Safely parse request body from Twilio
		const body = await parseTwilioRequest(request);
	
		// Log the call status update
		const taskId = url.searchParams.get('taskId') || body.taskId;
		
		console.log(`[${requestId}] Call Status Update:`, {
			CallSid: body.CallSid,
			CallStatus: body.CallStatus,
			CallDuration: body.CallDuration,
			From: body.From,
			To: body.To,
			TaskId: taskId,
			Timestamp: new Date().toISOString()
		});
		
		// Log any errors from Twilio
		if (body.ErrorCode) {
			logError(`[${requestId}] Twilio reported call error`, new Error(body.ErrorMessage), {
				ErrorCode: body.ErrorCode,
				CallSid: body.CallSid,
				TaskId: taskId
			});
		}
	
		// Return 200 OK - Twilio expects this
		console.log(`[${requestId}] ✅ Status update processed. Time: ${Date.now() - startTime}ms`);
		
		return new Response('OK', {
			status: 200,
			headers: {
				'Content-Type': 'text/plain',
				'Cache-Control': 'no-cache',
				'X-Request-ID': requestId,
				'X-Processing-Time': `${Date.now() - startTime}ms`
			}
		});
		
	} catch (error: any) {
		logError(`[${requestId}] Error in status webhook`, error);
		
		// Still return OK to Twilio even on error
		return new Response('OK', {
			status: 200,
			headers: {
				'Content-Type': 'text/plain',
				'Cache-Control': 'no-cache',
				'X-Request-ID': requestId,
				'X-Error': 'true'
			}
		});
	}
};

// Handle OPTIONS for CORS
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, X-Twilio-Signature'
		}
	});
};

// Handle GET for testing
export const GET: RequestHandler = async () => {
	return new Response('Status webhook is working', {
		status: 200,
		headers: {
			'Content-Type': 'text/plain'
		}
	});
};