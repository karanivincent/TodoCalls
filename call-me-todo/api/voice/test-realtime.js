// Test call endpoint using OpenAI Realtime API
export default async function handler(req, res) {
  console.log(`Test realtime call ${req.method} request`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Twilio-Signature');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  
  // Return TwiML that connects to our WebSocket endpoint
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${host}/api/voice/realtime-ws" />
  </Connect>
</Response>`;
  
  res.status(200);
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(twiml);
}