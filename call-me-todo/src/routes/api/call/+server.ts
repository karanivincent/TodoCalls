import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import twilio from 'twilio';
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } from '$env/static/private';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { phoneNumber, taskId } = await request.json();
		
		if (!phoneNumber) {
			return json({ error: 'Phone number is required' }, { status: 400 });
		}

		// Create the call
		const call = await client.calls.create({
			to: phoneNumber,
			from: TWILIO_PHONE_NUMBER,
			url: `${process.env.WEBHOOK_BASE_URL || 'http://localhost:5050'}/outbound-call`,
			method: 'POST',
			statusCallback: `${process.env.WEBHOOK_BASE_URL || 'http://localhost:5050'}/call-status`,
			statusCallbackMethod: 'POST',
			statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
			timeout: 60,
			record: false,
			machineDetection: 'Enable',
			asyncAmd: 'true',
			asyncAmdStatusCallback: `${process.env.WEBHOOK_BASE_URL || 'http://localhost:5050'}/amd-status`,
			asyncAmdStatusCallbackMethod: 'POST',
			sendDigits: '',
			...(taskId && {
				url: `${process.env.WEBHOOK_BASE_URL || 'http://localhost:5050'}/outbound-call?taskId=${taskId}`
			})
		});

		return json({
			success: true,
			callSid: call.sid,
			status: call.status,
			message: 'Call initiated successfully'
		});
	} catch (error: any) {
		console.error('Error initiating call:', error);
		return json({
			error: error.message || 'Failed to initiate call'
		}, { status: 500 });
	}
};