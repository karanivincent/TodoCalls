import type { RequestHandler } from './$types';

// Disable CSRF protection for this test endpoint
export const config = {
  csrf: false
};

// Simple ping endpoint to test webhook accessibility
export const GET: RequestHandler = async () => {
  return new Response('pong', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  console.log('Ping POST received:', body);
  
  return new Response('pong', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
};