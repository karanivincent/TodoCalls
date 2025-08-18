// Test call using OpenAI TTS API - NO TwiML Say commands
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// In-memory audio cache
const audioCache = new Map();

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
  
  // Try to get response from OpenAI GPT-4
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (openaiApiKey) {
    try {
      const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',  // Using GPT-4o mini for better quality
          messages: [
            {
              role: 'system',
              content: `You are a warm, friendly AI assistant for TeliTask. Generate a personalized, enthusiastic greeting for a test call. 
              Be natural and conversational like talking to a friend. 
              Mention you're excited to help them manage tasks by phone.
              Keep it under 3 sentences.
              Sound natural when spoken aloud - avoid complex words.
              Example style: "Hey there! It's great to connect with you. I'm your TeliTask assistant, and I'm here to help make managing your tasks as easy as having a chat."`
            },
            {
              role: 'user',
              content: 'Generate a warm, friendly test call greeting that sounds natural when spoken'
            }
          ],
          max_tokens: 150,
          temperature: 0.8
      });
      
      responseText = completion.choices[0].message.content;
      console.log('OpenAI GPT-4o response:', responseText);
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      // Fall back to default message
      responseText = "Hello! This is your TeliTask assistant. I'm here to help you manage your tasks through natural conversation. Thank you for testing our service!";
    }
  } else {
    // No API key, use default message
    responseText = "Hello! This is your TeliTask assistant. I'm here to help you manage your tasks through natural conversation. Thank you for testing our service!";
  }
  
  // Check if this is an audio serving request
  const url = new URL(req.url, `https://${req.headers.host}`);
  if (url.pathname.includes('/audio/')) {
    const audioId = url.pathname.split('/audio/')[1];
    const audioBuffer = audioCache.get(audioId);
    
    if (audioBuffer) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.status(200).end(audioBuffer);
      setTimeout(() => audioCache.delete(audioId), 60000);
      return;
    } else {
      res.status(404).end('Audio not found');
      return;
    }
  }
  
  try {
    // Generate high-quality audio using OpenAI TTS API
    const fullMessage = responseText + ' This was a test call. Have a wonderful day!';
    
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1-hd', // High-definition for best quality
      voice: 'nova', // Nova is warm and friendly (also try: alloy, echo, fable, onyx, shimmer)
      input: fullMessage,
      response_format: 'mp3',
      speed: 1.0
    });
    
    // Convert to buffer and cache
    const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
    const audioId = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    audioCache.set(audioId, audioBuffer);
    
    // Clean up after 5 minutes
    setTimeout(() => audioCache.delete(audioId), 300000);
    
    // Create audio URL
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const audioUrl = `${protocol}://${host}/api/voice/test-call/audio/${audioId}`;
    
    console.log('Generated audio URL:', audioUrl);
    
    // Return TwiML with Play command - NO Say commands!
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
    
    // Emergency fallback - pre-recorded audio
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>https://demo.twilio.com/docs/classic.mp3</Play>
</Response>`;
    
    res.status(200);
    res.setHeader('Content-Type', 'text/xml');
    res.send(fallbackTwiml);
  }
}