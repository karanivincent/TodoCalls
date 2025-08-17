import type { RequestHandler } from './$types';
import { text } from '@sveltejs/kit';

// Simple ping endpoint to test webhook accessibility
export const GET: RequestHandler = async () => {
  return text('pong', {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
};

export const POST: RequestHandler = async ({ request }) => {
  // Read body as text to bypass CSRF
  const body = await request.text();
  console.log('Ping POST received:', body);
  
  return text('pong', {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
};

// Handle OPTIONS requests (CORS preflight)
export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Twilio-Signature'
    }
  });
};

// Bypass CSRF protection for this endpoint
export const config = {
  csrf: false
};