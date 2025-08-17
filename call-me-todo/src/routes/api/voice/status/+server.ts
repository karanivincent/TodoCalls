import type { RequestHandler } from './$types';
import { text } from '@sveltejs/kit';

// Handle GET requests (Twilio validation)
export const GET: RequestHandler = async () => {
  console.log('Status webhook GET request received');
  
  return text('OK', {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
};

// Handle POST requests (status updates) - Bypass CSRF by using text() helper
export const POST: RequestHandler = async ({ request }) => {
  console.log('Status webhook POST request received');
  
  try {
    // Read the body as text first to bypass CSRF
    const body = await request.text();
    console.log('Raw body:', body);
    
    // Parse the form data manually
    const params = new URLSearchParams(body);
    
    // Log call status updates for debugging
    const callSid = params.get('CallSid');
    const callStatus = params.get('CallStatus');
    const from = params.get('From');
    const to = params.get('To');
    const duration = params.get('CallDuration');
    
    console.log(`Call Status Update:`, {
      callSid,
      callStatus,
      from,
      to,
      duration
    });
    
    // Always return 200 OK to acknowledge receipt
    return text('OK', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Status webhook error:', error);
    // Always return 200 to prevent Twilio retries
    return text('OK', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
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
export const csrf = false;