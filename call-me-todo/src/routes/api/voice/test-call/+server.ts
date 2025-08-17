import type { RequestHandler } from './$types';

// Helper function to generate TwiML without the Twilio library
function generateTwiML(messages: string[]): string {
  const sayElements = messages.map((message, index) => {
    const say = `<Say voice="alice" language="en-US">${message}</Say>`;
    const pause = index < messages.length - 1 ? '<Pause length="1"/>' : '';
    return say + pause;
  }).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${sayElements}</Response>`;
}

// Handle all request methods the same way to bypass CSRF
export const fallback: RequestHandler = async ({ request }) => {
  console.log(`Test call ${request.method} request received`);
  
  // For POST requests, consume the body to prevent CSRF checks
  if (request.method === 'POST') {
    try {
      await request.text();
    } catch {}
  }
  
  const messages = [
    'Hello! This is your Call Me Todo AI assistant test call.',
    'I can help you manage your tasks through natural conversation. You can ask me to create new tasks, list your upcoming reminders, or mark tasks as complete.',
    'When fully activated, I will use OpenAI to understand your voice commands and manage your tasks naturally. Thank you for testing Call Me Todo!',
    'Goodbye!'
  ];
  
  const twiml = generateTwiML(messages);
  
  return new Response(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Twilio-Signature'
    }
  });
};