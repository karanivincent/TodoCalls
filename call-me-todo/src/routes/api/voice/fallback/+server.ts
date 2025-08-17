import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import twilio from 'twilio';

export const POST: RequestHandler = async () => {
	const twiml = new twilio.twiml.VoiceResponse();
	
	twiml.say({
		voice: 'alice',
		language: 'en-US'
	}, 'We apologize, but we are experiencing technical difficulties. Please try again later.');
	
	return text(twiml.toString(), {
		headers: {
			'Content-Type': 'text/xml'
		}
	});
};