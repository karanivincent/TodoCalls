// Test call with OpenAI TTS for high-quality voice
export default async function handler(req, res) {
  console.log(`OpenAI TTS test call ${req.method} request`);
  
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
  <Say voice="alice" language="en-US">Hello! OpenAI API key is not configured. This is a fallback message.</Say>
</Response>`;
    
    res.status(200);
    res.setHeader('Content-Type', 'text/xml');
    res.send(twiml);
    return;
  }
  
  try {
    // First, get the text to speak from GPT
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
            content: `You are a warm, friendly AI assistant for Call Me Todo. Generate a personalized, enthusiastic greeting for a test call. 
            Be natural and conversational like talking to a friend. 
            Mention you're excited to help them manage tasks by phone.
            Keep it under 2 sentences.
            Example style: "Hey there! It's great to connect with you - I'm your Call Me Todo assistant, ready to help you stay on top of your tasks just by having a chat."`
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
    
    // Now generate audio using OpenAI TTS
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1-hd',  // Use HD model for better quality
        input: responseText + " This was a test call. Have a wonderful day!",
        voice: 'nova',  // Nova is friendly and conversational
        response_format: 'mp3'
      })
    });
    
    if (!ttsResponse.ok) {
      throw new Error(`TTS API error: ${ttsResponse.status}`);
    }
    
    // For Twilio, we need to provide a publicly accessible URL for the audio
    // Since we can't use data URLs or directly stream, we'll need to either:
    // 1. Save the audio to a temporary file and serve it
    // 2. Use a third-party service to host the audio
    // 3. Fall back to using Twilio's <Say> with SSML for better control
    
    // For now, let's use Twilio's Say with SSML for enhanced voice control
    // This provides better quality than basic Say
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    <prosody rate="95%" pitch="+5%">
      ${responseText}
    </prosody>
  </Say>
  <Pause length="1"/>
  <Say voice="Polly.Joanna" language="en-US">
    <prosody rate="95%" pitch="+5%">
      This was a test call. Have a wonderful day!
    </prosody>
  </Say>
</Response>`;
    
    res.status(200);
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(twiml);
    
  } catch (error) {
    console.error('Error with OpenAI:', error);
    
    // Fallback to Twilio voice
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">Hello! This is your Call Me Todo assistant. I'm here to help you manage your tasks. This was a test call. Goodbye!</Say>
</Response>`;
    
    res.status(200);
    res.setHeader('Content-Type', 'text/xml');
    res.send(fallbackTwiml);
  }
}