import type { RequestHandler } from './$types';

// Handle all request methods using fallback to bypass CSRF
export const fallback: RequestHandler = async ({ request }) => {
  console.log(`Ping ${request.method} request received`);
  
  // For POST requests, consume the body
  if (request.method === 'POST') {
    try {
      const body = await request.text();
      console.log('Ping body:', body);
    } catch {}
  }
  
  return new Response('pong', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  });
};