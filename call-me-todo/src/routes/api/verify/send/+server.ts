import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import twilio from 'twilio';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Initialize Twilio client inside the function
		const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
		// Create or get Verify Service (you might want to store this service SID in env vars)
		const VERIFY_SERVICE_SID = env.TWILIO_VERIFY_SERVICE_SID || 'VA' + 'x'.repeat(30); // placeholder
		// Get the authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.replace('Bearer ', '');
		const { phoneNumber, phoneId } = await request.json();
		
		console.log('Sending verification to:', phoneNumber);
		console.log('Using service SID:', VERIFY_SERVICE_SID);
		
		if (!phoneNumber) {
			return json({ error: 'Phone number is required' }, { status: 400 });
		}

		// Initialize Supabase client with the user's token
		const supabase = createClient(publicEnv.PUBLIC_SUPABASE_URL, publicEnv.PUBLIC_SUPABASE_ANON_KEY, {
			global: {
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		});

		// Get the current user
		const { data: { user }, error: userError } = await supabase.auth.getUser();
		if (userError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if this phone number belongs to the user
		const { data: phoneData, error: phoneError } = await supabase
			.from('phone_numbers')
			.select('*')
			.eq('id', phoneId)
			.eq('user_id', user.id)
			.single();

		if (phoneError || !phoneData) {
			return json({ error: 'Phone number not found' }, { status: 404 });
		}

		if (phoneData.is_verified) {
			return json({ error: 'Phone number already verified' }, { status: 400 });
		}

		try {
			// First, try to create a Verify service if it doesn't exist
			let serviceSid = VERIFY_SERVICE_SID;
			
			if (!serviceSid || serviceSid.includes('xxx')) {
				// Create a new Verify service
				const service = await client.verify.v2.services.create({
					friendlyName: 'TeliTask Verification',
					codeLength: 6,
					lookupEnabled: false,
					skipSmsToLandlines: false,
					dtmfInputRequired: false,
					doNotShareWarningEnabled: true
				});
				serviceSid = service.sid;
				console.log('Created new Verify service:', serviceSid);
				console.log('Add this to your .env: TWILIO_VERIFY_SERVICE_SID=' + serviceSid);
			}

			// Send verification code via SMS
			const verification = await client.verify.v2
				.services(serviceSid)
				.verifications
				.create({
					to: phoneNumber,
					channel: 'sms',
					locale: 'en'
				});

			return json({
				success: true,
				status: verification.status,
				message: 'Verification code sent successfully'
			});
		} catch (twilioError: any) {
			console.error('Twilio Verify error:', twilioError);
			
			// If service doesn't exist, try creating one
			if (twilioError.code === 20404) {
				const service = await client.verify.v2.services.create({
					friendlyName: 'TeliTask Verification',
					codeLength: 6,
					lookupEnabled: false,
					skipSmsToLandlines: false,
					dtmfInputRequired: false,
					doNotShareWarningEnabled: true
				});
				
				console.log('Created new Verify service:', service.sid);
				
				// Retry sending verification with new service
				const verification = await client.verify.v2
					.services(service.sid)
					.verifications
					.create({
						to: phoneNumber,
						channel: 'sms',
						locale: 'en'
					});

				return json({
					success: true,
					status: verification.status,
					message: 'Verification code sent successfully'
				});
			}
			
			throw twilioError;
		}
	} catch (error: any) {
		console.error('Error sending verification:', error);
		return json({
			error: error.message || 'Failed to send verification code'
		}, { status: 500 });
	}
};