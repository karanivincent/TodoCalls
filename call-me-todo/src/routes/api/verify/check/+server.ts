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
		// Use the same service SID as in send endpoint
		const VERIFY_SERVICE_SID = env.TWILIO_VERIFY_SERVICE_SID || 'VA' + 'x'.repeat(30);
		// Get the authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.replace('Bearer ', '');
		const { phoneNumber, phoneId, code } = await request.json();
		
		if (!phoneNumber || !code) {
			return json({ error: 'Phone number and code are required' }, { status: 400 });
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

		try {
			// Get the service SID (try from env first)
			let serviceSid = VERIFY_SERVICE_SID;
			
			// If no service SID, try to find existing service
			if (!serviceSid || serviceSid.includes('xxx')) {
				const services = await client.verify.v2.services.list({ limit: 1 });
				if (services.length > 0) {
					serviceSid = services[0].sid;
				} else {
					return json({ error: 'Verification service not configured' }, { status: 500 });
				}
			}

			// Check verification code
			const verificationCheck = await client.verify.v2
				.services(serviceSid)
				.verificationChecks
				.create({
					to: phoneNumber,
					code: code
				});

			if (verificationCheck.status === 'approved') {
				// Update phone number as verified in database
				const { error: updateError } = await supabase
					.from('phone_numbers')
					.update({ 
						is_verified: true,
						verified_at: new Date().toISOString()
					})
					.eq('id', phoneId)
					.eq('user_id', user.id);

				if (updateError) {
					console.error('Error updating phone verification status:', updateError);
					return json({ 
						error: 'Verification successful but failed to update status' 
					}, { status: 500 });
				}

				return json({
					success: true,
					status: 'approved',
					message: 'Phone number verified successfully'
				});
			} else {
				return json({
					success: false,
					status: verificationCheck.status,
					message: verificationCheck.status === 'pending' 
						? 'Invalid verification code' 
						: `Verification ${verificationCheck.status}`
				}, { status: 400 });
			}
		} catch (twilioError: any) {
			console.error('Twilio Verify check error:', twilioError);
			
			if (twilioError.code === 20404) {
				return json({ 
					error: 'Verification not found or expired. Please request a new code.' 
				}, { status: 404 });
			}
			
			throw twilioError;
		}
	} catch (error: any) {
		console.error('Error checking verification:', error);
		return json({
			error: error.message || 'Failed to verify code'
		}, { status: 500 });
	}
};