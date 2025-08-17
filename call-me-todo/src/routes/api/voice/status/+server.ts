import type { RequestHandler } from './$types';

// This endpoint must be publicly accessible for Twilio
export const config = {
  runtime: 'edge'
};

// Handle GET requests (Twilio validation)
export const GET: RequestHandler = async () => {
  console.log('Status webhook GET request received');
  
  return new Response('OK', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
};

// Handle POST requests (status updates)
export const POST: RequestHandler = async ({ request }) => {
  console.log('Status webhook POST request received');
  
  try {
    const formData = await request.formData();
    
    // Log call status updates for debugging
    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');
    const from = formData.get('From');
    const to = formData.get('To');
    const duration = formData.get('CallDuration');
    
    console.log(`Call Status Update:`, {
      callSid,
      callStatus,
      from,
      to,
      duration
    });
    
    // Always return 200 OK to acknowledge receipt
    return new Response('OK', { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Status webhook error:', error);
    // Always return 200 to prevent Twilio retries
    return new Response('OK', { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
};