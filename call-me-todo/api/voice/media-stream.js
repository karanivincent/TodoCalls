// Modern WebSocket handler for Twilio Media Streams + OpenAI Realtime API
import { WebSocketServer } from 'ws';
import { RealtimeClient } from '@openai/realtime-api-beta';

// Store active sessions
const sessions = new Map();

// Create WebSocket server
let wss;

export default async function handler(req, res) {
  console.log(`Media stream ${req.method} request`);
  
  // Handle HTTP upgrade to WebSocket
  if (req.headers.upgrade === 'websocket') {
    if (!wss) {
      wss = new WebSocketServer({ noServer: true });
    }
    
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
      handleWebSocket(ws);
    });
    return;
  }
  
  // Return TwiML that connects to our WebSocket
  if (req.method === 'POST' || req.method === 'GET') {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const wsUrl = `wss://${host}/api/voice/media-stream`;
    
    // Minimal TwiML just to establish media stream
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}" />
  </Connect>
  <Pause length="60" />
</Response>`;
    
    res.status(200);
    res.setHeader('Content-Type', 'text/xml');
    res.send(twiml);
  }
}

async function handleWebSocket(ws) {
  console.log('WebSocket connected');
  
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error('OpenAI API key not configured');
    ws.close();
    return;
  }
  
  let streamSid = null;
  let openaiWs = null;
  let client = null;
  
  try {
    // Initialize OpenAI Realtime client
    client = new RealtimeClient({
      apiKey: openaiApiKey,
      dangerouslyAllowBrowser: false
    });
    
    // Configure session
    await client.updateSession({
      instructions: `You are a warm, friendly AI assistant for Call Me Todo. 
        You help users manage their tasks through natural conversation. 
        Be conversational, helpful, and concise. 
        Sound natural and enthusiastic.
        For test calls, greet warmly and mention you're their Call Me Todo assistant.`,
      voice: 'alloy', // Can be: alloy, echo, shimmer
      input_audio_format: 'g711_ulaw',
      output_audio_format: 'g711_ulaw',
      input_audio_transcription: {
        model: 'whisper-1'
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      },
      tools: [],
      modalities: ['text', 'audio'],
      temperature: 0.8
    });
    
    // Connect to OpenAI
    await client.connect();
    openaiWs = client.ws;
    
    // Handle incoming audio from Twilio
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        
        switch (msg.event) {
          case 'start':
            streamSid = msg.start.streamSid;
            console.log('Stream started:', streamSid);
            
            // Send initial greeting
            client.sendUserMessageContent([{
              type: 'input_text',
              text: 'Start the conversation with a warm greeting'
            }]);
            break;
            
          case 'media':
            // Forward audio to OpenAI
            if (msg.media.payload && openaiWs && openaiWs.readyState === 1) {
              client.appendInputAudio(Buffer.from(msg.media.payload, 'base64'));
            }
            break;
            
          case 'stop':
            console.log('Stream stopped');
            if (client) client.disconnect();
            break;
        }
      } catch (error) {
        console.error('Error processing Twilio message:', error);
      }
    });
    
    // Handle OpenAI responses
    client.on('conversation.item.completed', (event) => {
      const { item } = event;
      if (item.type === 'message' && item.role === 'assistant') {
        console.log('Assistant:', item.content?.map(c => c.text).join(' '));
      }
    });
    
    // Stream audio back to Twilio
    client.on('response.audio.delta', (event) => {
      if (event.delta && ws.readyState === 1) {
        const audioData = Buffer.from(event.delta, 'base64').toString('base64');
        ws.send(JSON.stringify({
          event: 'media',
          streamSid: streamSid,
          media: {
            payload: audioData
          }
        }));
      }
    });
    
    // Handle errors
    client.on('error', (error) => {
      console.error('OpenAI error:', error);
    });
    
    ws.on('close', () => {
      console.log('WebSocket closed');
      if (client) client.disconnect();
      if (streamSid) sessions.delete(streamSid);
    });
    
  } catch (error) {
    console.error('WebSocket handler error:', error);
    ws.close();
  }
}