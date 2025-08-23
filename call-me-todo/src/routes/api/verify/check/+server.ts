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
		console.log('Looking for phone record - User ID:', user.id, 'Phone ID:', phoneId);
		const { data: phoneData, error: phoneError } = await supabase
			.from('phone_numbers')
			.select('*')
			.eq('id', phoneId)
			.eq('user_id', user.id)
			.single();

		console.log('Phone lookup result:', { phoneData, phoneError });
		if (phoneError || !phoneData) {
			console.error('Phone number not found for user', user.id, 'phone ID', phoneId, 'Error:', phoneError);
			return json({ error: 'Phone number not found' }, { status: 404 });
		}

		try {
			console.log('Checking verification for:', phoneNumber, 'with code:', code);
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
				console.log('Twilio verification approved! Updating database...');
				console.log('Update target - Phone ID:', phoneId, 'User ID:', user.id);
				
				// First, let's verify the record still exists and get its current state
				const { data: currentRecord, error: fetchError } = await supabase
					.from('phone_numbers')
					.select('*')
					.eq('id', phoneId)
					.eq('user_id', user.id)
					.single();
					
				console.log('Current record before update:', { currentRecord, fetchError });
				
				if (fetchError) {
					console.error('Could not fetch phone record for verification update:', fetchError);
					return json({ 
						error: 'Verification successful but phone record not found',
						details: 'Phone record may have been deleted or access denied'
					}, { status: 404 });
				}
				
				// Update phone number as verified in database
				const { error: updateError, data: updateData } = await supabase
					.from('phone_numbers')
					.update({ 
						is_verified: true,
						updated_at: new Date().toISOString()
					})
					.eq('id', phoneId)
					.eq('user_id', user.id)
					.select();

				console.log('Database update result:', { updateData, updateError });
				
				if (updateError) {
					console.error('Error updating phone verification status:', updateError);
					console.error('Update error details:', JSON.stringify(updateError, null, 2));
					return json({ 
						error: 'Verification successful but failed to update status',
						details: updateError.message || 'Database update failed'
					}, { status: 500 });
				}

				if (!updateData || updateData.length === 0) {
					console.error('No rows updated - this should not happen after successful fetch');
					// Try to fetch the record again to see if it was updated by something else
					const { data: finalRecord } = await supabase
						.from('phone_numbers')
						.select('*')
						.eq('id', phoneId)
						.eq('user_id', user.id)
						.single();
					console.log('Final record state:', finalRecord);
					
					return json({ 
						error: 'Verification successful but update returned no rows',
						details: 'Phone record exists but update failed unexpectedly'
					}, { status: 500 });
				}

				console.log('Successfully updated phone verification status:', updateData[0]);
			

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
			console.error('Full error details:', JSON.stringify(twilioError, null, 2));
			
			if (twilioError.code === 20404) {
				return json({ 
					error: 'Verification code expired or not found. Please request a new code.',
					details: 'This usually happens if the code was entered too late or has already been used.'
				}, { status: 404 });
			}
			
			if (twilioError.code === 20003) {
				return json({ 
					error: 'Authentication failed. Please try again.',
					details: 'There was an issue with the Twilio service authentication.'
				}, { status: 401 });
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