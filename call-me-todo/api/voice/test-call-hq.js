// High-quality test call using OpenAI GPT-4o for text and TTS for voice
export default async function handler(req, res) {
  console.log(`HQ test call ${req.method} request`);
  
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
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    // Fallback to Twilio voice if no API key
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">Hello! OpenAI API key is not configured. This is a fallback message.</Say>
</Response>`;
    
    res.status(200);
    res.setHeader('Content-Type', 'text/xml');
    res.send(twiml);
    return;
  }
  
  try {
    // Get personalized greeting from GPT-4o
    const textResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are Nova, a warm and friendly AI assistant for Call Me Todo. Generate a personalized, enthusiastic greeting for a test call. 
            Your personality is: professional yet friendly, energetic but not overwhelming, helpful and supportive.
            Mention you're excited to help them manage tasks through natural phone conversations.
            Keep it to 2-3 short, natural sentences that sound good when spoken aloud.
            Example: "Hey there! It's Nova from Call Me Todo, and I'm really excited to connect with you. I'm here to help you stay on top of your tasks, just by having a conversation."`
          },
          {
            role: 'user',
            content: 'Generate a warm, friendly test call greeting'
          }
        ],
        max_tokens: 100,
        temperature: 0.8
      })
    });
    
    if (!textResponse.ok) {
      throw new Error(`GPT API error: ${textResponse.status}`);
    }
    
    const textData = await textResponse.json();
    responseText = textData.choices[0].message.content;
    console.log('GPT-4o response:', responseText);
    
    // Add a closing message
    const fullMessage = responseText + " This was a test call to make sure everything's working perfectly. Have a wonderful day!";
    
    // Get the base URL from environment or request
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : `https://${req.headers.host}`;
    
    // Create URL for audio endpoint
    const audioUrl = `${baseUrl}/api/voice/audio-stream?text=${encodeURIComponent(fullMessage)}&voice=nova`;
    
    // Generate TwiML with Play directive pointing to our audio endpoint
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
</Response>`;
    
    res.status(200);
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(twiml);
    
  } catch (error) {
    console.error('Error with OpenAI:', error);
    
    // Enhanced fallback with Amazon Polly voice (better than basic Alice)
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    <prosody rate="95%" pitch="+5%">
      Hello! This is your Call Me Todo assistant. I'm here to help you manage your tasks through conversation. This was a test call. Have a great day!
    </prosody>
  </Say>
</Response>`;
    
    res.status(200);
    res.setHeader('Content-Type', 'text/xml');
    res.send(fallbackTwiml);
  }
}