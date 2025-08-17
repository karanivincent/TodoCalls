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

// Try to bypass CSRF by immediately returning a Response
export const POST: RequestHandler = async ({ request, url }) => {
  console.log('Ping POST endpoint hit');
  console.log('URL:', url.toString());
  console.log('Headers:', Object.fromEntries(request.headers));
  
  // Don't await or read the body - just return immediately
  return new Response('pong', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache'
    }
  });
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

// This is the correct way to disable CSRF in SvelteKit
export const csrf = false;