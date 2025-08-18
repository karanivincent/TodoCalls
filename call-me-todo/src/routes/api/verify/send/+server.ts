import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import twilio from 'twilio';
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Create or get Verify Service (you might want to store this service SID in env vars)
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID || 'VA' + 'x'.repeat(30); // placeholder

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession();
		if (!session) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { phoneNumber, phoneId } = await request.json();
		
		if (!phoneNumber) {
			return json({ error: 'Phone number is required' }, { status: 400 });
		}

		// Initialize Supabase client with user session
		const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			global: {
				headers: {
					Authorization: `Bearer ${session.access_token}`
				}
			}
		});

		// Check if this phone number belongs to the user
		const { data: phoneData, error: phoneError } = await supabase
			.from('phone_numbers')
			.select('*')
			.eq('id', phoneId)
			.eq('user_id', session.user.id)
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