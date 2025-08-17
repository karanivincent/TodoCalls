import type { RequestHandler } from './$types';

// Handle all request methods the same way to bypass CSRF
export const fallback: RequestHandler = async ({ request }) => {
  console.log(`Status webhook ${request.method} request received`);
  
  // For POST requests, consume and log the body
  if (request.method === 'POST') {
    try {
      const body = await request.text();
      console.log('Raw body:', body);
      
      // Parse the form data
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
    } catch (error) {
      console.error('Error processing status webhook:', error);
    }
  }
  
  // Always return 200 OK to acknowledge receipt
  return new Response('OK', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Twilio-Signature'
    }
  });
};