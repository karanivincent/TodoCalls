// Raw Vercel Function - bypasses SvelteKit entirely
export default function handler(req, res) {
  console.log(`Test call ${req.method} request`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Twilio-Signature');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  // Generate TwiML response
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">Hello! This is your Call Me Todo AI assistant test call.</Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-US">I can help you manage your tasks through natural conversation.</Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-US">Thank you for testing Call Me Todo!</Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-US">Goodbye!</Say>
</Response>`;
  
  res.status(200);
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(twiml);
}