// Raw Vercel Function with OpenAI integration
export default async function handler(req, res) {
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
  
  let responseText = '';
  
  // Try to get response from OpenAI
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (openaiApiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a warm, friendly AI assistant for Call Me Todo. Generate a personalized, enthusiastic greeting for a test call. 
              Be natural and conversational like talking to a friend. 
              Mention you're excited to help them manage tasks by phone.
              Keep it under 3 sentences.
              Example style: "Hi there! It's great to connect with you. I'm your Call Me Todo assistant, and I'm here to help make managing your tasks as easy as having a conversation."`
            },
            {
              role: 'user',
              content: 'Generate a warm, friendly test call greeting'
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        responseText = data.choices[0].message.content;
        console.log('OpenAI response:', responseText);
      } else {
        console.error('OpenAI API error:', response.status);
        // Fall back to default message
        responseText = "Hello! This is your Call Me Todo AI assistant. I can help you manage your tasks through natural conversation. Thank you for testing our service!";
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      // Fall back to default message
      responseText = "Hello! This is your Call Me Todo AI assistant. I can help you manage your tasks through natural conversation. Thank you for testing our service!";
    }
  } else {
    // No API key, use default message
    responseText = "Hello! This is your Call Me Todo AI assistant. I can help you manage your tasks through natural conversation. Thank you for testing our service!";
  }
  
  // Generate TwiML response with the text
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">${responseText}</Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-US">Goodbye!</Say>
</Response>`;
  
  res.status(200);
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(twiml);
}