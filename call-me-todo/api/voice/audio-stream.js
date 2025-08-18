// Endpoint to generate and stream OpenAI TTS audio
export default async function handler(req, res) {
  console.log(`Audio stream ${req.method} request`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const { text, voice = 'nova' } = req.query;
  
  if (!openaiApiKey || !text) {
    res.status(400).json({ error: 'Missing API key or text parameter' });
    return;
  }
  
  try {
    // Generate audio using OpenAI TTS
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1-hd',  // Use HD model for better quality
        input: text,
        voice: voice,  // Can be: alloy, echo, fable, onyx, nova, shimmer
        response_format: 'mp3'
      })
    });
    
    if (!ttsResponse.ok) {
      throw new Error(`TTS API error: ${ttsResponse.status}`);
    }
    
    // Stream the audio directly to the response
    res.status(200);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Stream the response
    const reader = ttsResponse.body.getReader();
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        return;
      }
      res.write(Buffer.from(value));
      return pump();
    };
    
    await pump();
    
  } catch (error) {
    console.error('Error with OpenAI TTS:', error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
}