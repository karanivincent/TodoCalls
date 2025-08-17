import type { RequestHandler } from './$types';

// Simple webhook test endpoint that always returns success
export const config = {
  runtime: 'edge'
};

export const GET: RequestHandler = async ({ url }) => {
  console.log('Webhook test GET:', url.toString());
  
  return new Response('Webhook test successful!', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
};

export const POST: RequestHandler = async ({ request, url }) => {
  console.log('Webhook test POST:', url.toString());
  
  try {
    const body = await request.text();
    console.log('Request body:', body);
    
    return new Response('Webhook test successful!', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  } catch (error) {
    console.error('Webhook test error:', error);
    return new Response('Error in webhook test', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
};