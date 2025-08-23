import twilio from 'twilio';
import { env } from '$env/dynamic/private';

export interface CallResult {
	success: boolean;
	callSid?: string;
	taskId: string;
	error?: string;
	code?: string;
	phoneNumber?: string;
}

export interface CallOptions {
	baseUrl?: string;
	timeout?: number;
	requestId?: string;
}

export async function initiateTaskCall(
	taskId: string,
	supabaseClient: any,
	options: CallOptions = {}
): Promise<CallResult> {
	const requestId = options.requestId || Math.random().toString(36).substring(7);
	const baseUrl = (options.baseUrl || 'https://telitask.com').replace(/\/+$/, ''); // Remove trailing slashes
	const timeout = options.timeout || 60;
	
	console.log(`📞 [CALL-INIT] [${requestId}] Initiating call for task: ${taskId}`);
	
	try {
		// Fetch task details from database
		console.log(`📞 [CALL-INIT] [${requestId}] Fetching task from database...`);
		const { data: task, error: taskError } = await supabaseClient
			.from('tasks')
			.select('*')
			.eq('id', taskId)
			.single();
		
		if (taskError || !task) {
			console.error(`📞 [CALL-INIT] [${requestId}] ❌ Task not found:`, { taskError, taskId });
			return {
				success: false,
				taskId,
				error: taskError?.message || 'Task not found',
				code: taskError?.code
			};
		}
		
		console.log(`📞 [CALL-INIT] [${requestId}] ✅ Task found:`, {
			id: task.id,
			title: task.title?.substring(0, 50),
			phone: task.phone_number,
			status: task.status
		});
		
		// Validate required fields
		if (!task.phone_number) {
			console.error(`📞 [CALL-INIT] [${requestId}] ❌ No phone number for task`);
			return {
				success: false,
				taskId,
				error: 'Task has no phone number configured'
			};
		}
		
		// Initialize Twilio client
		console.log(`📞 [CALL-INIT] [${requestId}] Initializing Twilio client...`);
		if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
			console.error(`📞 [CALL-INIT] [${requestId}] ❌ Missing Twilio credentials`);
			return {
				success: false,
				taskId,
				error: 'Twilio credentials not configured'
			};
		}
		
		const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
		const fromPhoneNumber = env.TWILIO_PHONE_NUMBER.trim(); // Remove newlines/whitespace
		
		// Create webhook URLs
		const webhookUrl = `${baseUrl}/api/voice/task-reminder?taskId=${task.id}`;
		const statusCallbackUrl = `${baseUrl}/api/voice/status?taskId=${task.id}`;
		
		console.log(`📞 [CALL-INIT] [${requestId}] Creating Twilio call:`, {
			to: task.phone_number,
			from: fromPhoneNumber,
			webhookUrl,
			timeout
		});
		
		// Create the call
		const call = await twilioClient.calls.create({
			to: task.phone_number,
			from: fromPhoneNumber,
			url: webhookUrl,
			method: 'POST',
			statusCallback: statusCallbackUrl,
			statusCallbackMethod: 'POST',
			statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no-answer'],
			timeout,
			record: false
		});
		
		console.log(`📞 [CALL-INIT] [${requestId}] ✅ Twilio call created successfully:`, {
			callSid: call.sid,
			status: call.status,
			to: call.to,
			from: call.from
		});
		
		return {
			success: true,
			callSid: call.sid,
			taskId,
			phoneNumber: task.phone_number
		};
		
	} catch (error: any) {
		console.error(`📞 [CALL-INIT] [${requestId}] ❌ Error initiating call:`, {
			error: error.message,
			code: error.code,
			moreInfo: error.moreInfo,
			taskId
		});
		
		return {
			success: false,
			taskId,
			error: error.message || 'Failed to initiate call',
			code: error.code
		};
	}
}