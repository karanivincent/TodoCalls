import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import twilio from 'twilio';
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } from '$env/static/private';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { phoneNumber, taskId, isTestCall } = await request.json();
		
		if (!phoneNumber) {
			return json({ error: 'Phone number is required' }, { status: 400 });
		}

		// Always use the production URL for consistency
		const baseUrl = 'https://telitask.com';
		
		// Determine the endpoint based on whether it's a test call or task reminder
		let url = `${baseUrl}/api/voice/`;
		if (isTestCall) {
			url += 'test-call-audio'; // Use the audio version that properly serves audio files
		} else if (taskId) {
			url += `task-reminder?taskId=${taskId}`; // Use the new task-reminder endpoint
		} else {
			url += 'incoming';
		}

		// Create the call
		const call = await client.calls.create({
			to: phoneNumber,
			from: TWILIO_PHONE_NUMBER,
			url: url,
			method: 'POST',
			statusCallback: `${baseUrl}/api/voice/status`,
			statusCallbackMethod: 'POST',
			statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
			timeout: 60,
			record: false
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