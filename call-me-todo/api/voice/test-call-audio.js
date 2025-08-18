// Test call using OpenAI TTS API to generate audio (no TwiML Say)
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// In-memory cache for audio (in production, use a proper storage solution)
const audioCache = new Map();

export default async function handler(req, res) {
  console.log(`Test call audio ${req.method} request at ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Twilio-Signature');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  // Check if this is an audio request
  const url = new URL(req.url, `https://${req.headers.host}`);
  if (url.pathname.includes('/audio/')) {
    const audioId = url.pathname.split('/audio/')[1];
    const audioBuffer = audioCache.get(audioId);
    
    if (audioBuffer) {
      console.log(`Serving audio ${audioId}`);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.status(200).end(audioBuffer);
      // Clean up after serving
      setTimeout(() => audioCache.delete(audioId), 60000);
      return;
    } else {
      res.status(404).end('Audio not found');
      return;
    }
  }
  
  try {
    // Generate personalized greeting text with GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Nova, a warm and friendly AI assistant for Call Me Todo. 
            Generate a personalized, enthusiastic greeting for a test call. 
            Your personality is: professional yet friendly, energetic but not overwhelming.
            Mention you're excited to help them manage tasks through natural phone conversations.
            Keep it to 2-3 short, natural sentences that sound great when spoken.
            End with mentioning this is a test call.`
        },
        {
          role: 'user',
          content: 'Generate a warm test call greeting'
        }
      ],
      max_tokens: 150,
      temperature: 0.8
    });
    
    const greetingText = completion.choices[0].message.content;
    console.log('Generated greeting:', greetingText);
    
    // Generate high-quality audio using OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1-hd', // High-definition model
      voice: 'nova', // Nova voice is warm and friendly
      input: greetingText + ' This is a test call. Have a wonderful day!',
      response_format: 'mp3',
      speed: 1.0
    });
    
    // Convert response to buffer
    const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
    
    // Generate unique ID for this audio
    const audioId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    audioCache.set(audioId, audioBuffer);
    
    // Clean up after 5 minutes
    setTimeout(() => audioCache.delete(audioId), 300000);
    
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const audioUrl = `${protocol}://${host}/api/voice/test-call-audio/audio/${audioId}`;
    
    console.log('Audio URL:', audioUrl);
    
    // Return TwiML with Play command (no Say command!)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
</Response>`;
    
    res.status(200);
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(twiml);
    
  } catch (error) {
    console.error('Error generating audio:', error);
    
    // Emergency fallback - only if OpenAI completely fails
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>https://demo.twilio.com/docs/classic.mp3</Play>
</Response>`;
    
    res.status(200);
    res.setHeader('Content-Type', 'text/xml');
    res.send(fallbackTwiml);
  }
}