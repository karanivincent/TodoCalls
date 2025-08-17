// Raw Vercel Function for testing - bypasses SvelteKit entirely
export default function handler(req, res) {
  console.log(`Ping ${req.method} request`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  // Log body for POST
  if (req.method === 'POST') {
    console.log('Ping body:', req.body);
  }
  
  res.status(200);
  res.setHeader('Content-Type', 'text/plain');
  res.send('pong');
}