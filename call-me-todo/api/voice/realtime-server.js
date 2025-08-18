// Modern Twilio + OpenAI Realtime API implementation
// Based on: https://www.twilio.com/en-us/blog/voice-ai-assistant-openai-realtime-api-node

import WebSocket from 'ws';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SYSTEM_MESSAGE = `You are a warm, friendly AI assistant for Call Me Todo. 
  You help users manage their tasks through natural phone conversations. 
  Be conversational, helpful, and concise. Sound natural and enthusiastic.
  For test calls, greet warmly and mention you're their Call Me Todo assistant ready to help with task management.`;
const VOICE = 'nova'; // alloy, echo, fable, onyx, nova, shimmer

// Event types to log for debugging
const LOG_EVENT_TYPES = [
  'response.content.done',
  'rate_limits.updated', 
  'response.done',
  'input_audio_buffer.committed',
  'input_audio_buffer.speech_stopped',
  'input_audio_buffer.speech_started',
  'session.created'
];

export default async function handler(req, res) {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  
  // Handle the initial HTTP request - return TwiML with Stream
  if (pathname === '/api/voice/realtime-server' && req.method === 'POST') {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    
    // Return TwiML that starts a media stream
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${host}/api/voice/realtime-ws" />
  </Connect>
</Response>`;
    
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml);
    return;
  }
  
  // Handle WebSocket upgrade for media stream
  if (pathname === '/api/voice/realtime-ws' && req.headers.upgrade === 'websocket') {
    handleWebSocketUpgrade(req, res);
    return;
  }
  
  // Default response
  res.writeHead(404);
  res.end('Not found');
}

function handleWebSocketUpgrade(req, res) {
  const wss = new WebSocket.Server({ noServer: true });
  
  wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
    wss.emit('connection', ws, req);
    handleWebSocketConnection(ws);
  });
}

function handleWebSocketConnection(ws) {
  console.log('New WebSocket connection established');
  
  let streamSid = null;
  let openAiWs = null;
  
  // Connect to OpenAI Realtime API
  const connectToOpenAI = () => {
    const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
    
    openAiWs = new WebSocket(url, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });
    
    openAiWs.on('open', () => {
      console.log('Connected to OpenAI Realtime API');
      
      // Configure the session
      const sessionUpdate = {
        type: 'session.update',
        session: {
          turn_detection: { type: 'server_vad' },
          input_audio_format: 'g711_ulaw',
          output_audio_format: 'g711_ulaw',
          voice: VOICE,
          instructions: SYSTEM_MESSAGE,
          modalities: ['text', 'audio'],
          temperature: 0.8
        }
      };
      
      console.log('Sending session update:', JSON.stringify(sessionUpdate));
      openAiWs.send(JSON.stringify(sessionUpdate));
      
      // Send initial greeting prompt
      sendInitialGreeting();
    });
    
    openAiWs.on('message', (data) => {
      try {
        const response = JSON.parse(data);
        
        if (LOG_EVENT_TYPES.includes(response.type)) {
          console.log(`OpenAI Event: ${response.type}`, response);
        }
        
        // Handle audio delta from OpenAI
        if (response.type === 'response.audio.delta' && response.delta) {
          const audioDelta = {
            event: 'media',
            streamSid: streamSid,
            media: { payload: response.delta }
          };
          ws.send(JSON.stringify(audioDelta));
        }
        
        // Handle transcripts
        if (response.type === 'response.audio_transcript.done') {
          console.log('Assistant said:', response.transcript);
        }
        
        if (response.type === 'conversation.item.input_audio_transcription.completed') {
          console.log('User said:', response.transcript);
        }
      } catch (error) {
        console.error('Error processing OpenAI message:', error);
      }
    });
    
    openAiWs.on('error', (error) => {
      console.error('OpenAI WebSocket error:', error);
    });
    
    openAiWs.on('close', () => {
      console.log('Disconnected from OpenAI');
    });
  };
  
  // Send initial greeting
  const sendInitialGreeting = () => {
    const initialMessage = {
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
        instructions: 'Greet the user warmly and introduce yourself as their Call Me Todo assistant. Keep it brief and friendly.'
      }
    };
    
    if (openAiWs && openAiWs.readyState === WebSocket.OPEN) {
      openAiWs.send(JSON.stringify(initialMessage));
    }
  };
  
  // Handle messages from Twilio
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.event) {
        case 'start':
          streamSid = data.start.streamSid;
          console.log('Incoming stream started', streamSid);
          connectToOpenAI();
          break;
          
        case 'media':
          // Forward audio to OpenAI
          if (openAiWs && openAiWs.readyState === WebSocket.OPEN) {
            const audioAppend = {
              type: 'input_audio_buffer.append',
              audio: data.media.payload
            };
            openAiWs.send(JSON.stringify(audioAppend));
          }
          break;
          
        case 'stop':
          console.log('Stream stopped');
          if (openAiWs && openAiWs.readyState === WebSocket.OPEN) {
            openAiWs.close();
          }
          break;
          
        default:
          console.log('Received event:', data.event);
          break;
      }
    } catch (error) {
      console.error('Error parsing Twilio message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Twilio WebSocket closed');
    if (openAiWs && openAiWs.readyState === WebSocket.OPEN) {
      openAiWs.close();
    }
  });
  
  ws.on('error', (error) => {
    console.error('Twilio WebSocket error:', error);
  });
}