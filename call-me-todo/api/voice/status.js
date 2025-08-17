// Raw Vercel Function for status webhook - bypasses SvelteKit entirely
export default function handler(req, res) {
  console.log(`Status webhook ${req.method} request`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Twilio-Signature');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  // Log the status update if POST
  if (req.method === 'POST' && req.body) {
    console.log('Call Status Update:', req.body);
  }
  
  // Always return 200 OK
  res.status(200);
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send('OK');
}