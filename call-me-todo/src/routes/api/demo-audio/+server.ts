import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// Cache the audio in memory to avoid regenerating
let cachedAudio: Buffer | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // Cache for 24 hours

export async function GET() {
  try {
    // Check if we have cached audio that's still fresh
    const now = Date.now();
    if (cachedAudio && (now - cacheTime) < CACHE_DURATION) {
      console.log('Serving cached demo audio');
      return new Response(cachedAudio, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400', // Browser cache for 24 hours
          'Content-Length': cachedAudio.length.toString()
        }
      });
    }

    console.log('Generating new demo audio');
    
    // Generate a friendly demo message
    const demoScript = `Hi there! This is Nova from TeliTask, your friendly AI reminder assistant. 
    Imagine getting a call just like this for your important tasks. 
    Whether it's a team meeting in 30 minutes, time to take your medication, or picking up the kids from school, 
    I'll make sure you never forget what matters most. 
    With TeliTask, staying on top of your day is as easy as answering the phone. 
    Ready to try it? Visit telitask.com to get started!`;

    // Generate high-quality audio using OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1-hd', // High-definition for better quality
      voice: 'nova', // Warm and friendly voice
      input: demoScript,
      response_format: 'mp3',
      speed: 1.0
    });

    // Convert to buffer
    const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
    
    // Cache the audio
    cachedAudio = audioBuffer;
    cacheTime = now;
    
    console.log('Demo audio generated and cached');

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400', // Browser cache for 24 hours
        'Content-Length': audioBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error generating demo audio:', error);
    
    // Return error response
    return new Response(JSON.stringify({ error: 'Failed to generate demo audio' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}