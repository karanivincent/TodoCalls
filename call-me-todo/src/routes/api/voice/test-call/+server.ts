import type { RequestHandler } from './$types';

// Disable CSRF protection for Twilio webhooks
export const config = {
  csrf: false
};

// This endpoint must be publicly accessible for Twilio

// Handle OPTIONS requests (CORS preflight)
export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Twilio-Signature'
    }
  });
};

// Helper function to generate TwiML without the Twilio library
function generateTwiML(messages: string[]): string {
  const sayElements = messages.map((message, index) => {
    const say = `<Say voice="alice" language="en-US">${message}</Say>`;
    const pause = index < messages.length - 1 ? '<Pause length="1"/>' : '';
    return say + pause;
  }).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${sayElements}</Response>`;
}

// Handle GET requests (Twilio validation)
export const GET: RequestHandler = async () => {
  console.log('Test call GET request received');
  
  const twiml = generateTwiML(['Test call endpoint is active.']);
  
  return new Response(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
};

// Handle POST requests (actual calls)
export const POST: RequestHandler = async ({ request }) => {
  console.log('Test call POST request received');
  
  try {
    const messages = [
      'Hello! This is your Call Me Todo AI assistant test call.',
      'I can help you manage your tasks through natural conversation. You can ask me to create new tasks, list your upcoming reminders, or mark tasks as complete.',
      'When fully activated, I will use OpenAI to understand your voice commands and manage your tasks naturally. Thank you for testing Call Me Todo!',
      'Goodbye!'
    ];
    
    const twiml = generateTwiML(messages);
    
    console.log('Generated TwiML:', twiml);

    return new Response(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Test call error:', error);
    
    // Return error TwiML
    const errorTwiml = generateTwiML(['Sorry, an error occurred. Please try again later.']);
    
    return new Response(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
};