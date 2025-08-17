import type { RequestHandler } from './$types';

// Simple ping endpoint to test webhook accessibility
export const GET: RequestHandler = async () => {
  return new Response('pong', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache'
    }
  });
};

// Handle POST without triggering CSRF
export const POST: RequestHandler = async ({ request, setHeaders }) => {
  console.log('Ping POST endpoint hit');
  
  // Set headers immediately
  setHeaders({
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache'
  });
  
  // Read body to consume it
  const body = await request.text();
  console.log('Ping POST received:', body);
  
  return new Response('pong');
};

// Handle OPTIONS
export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  });
};