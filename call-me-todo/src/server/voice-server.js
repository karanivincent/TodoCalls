import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VOICE = 'alloy';

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a helpful AI assistant for Call-Me Todo, a task management app. 
You can help users:
1. Create new tasks by asking for the task title and scheduled time
2. List their upcoming tasks
3. Mark tasks as complete
4. Update or reschedule existing tasks
5. Delete tasks

When creating tasks, always confirm:
- Task title/description
- When they want to be reminded (date and time)

Be conversational but concise. After completing an action, ask if there's anything else they need.`;

// Store active connections
const connections = new Map();

// Handle incoming calls
app.post('/incoming-call', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say({
    voice: 'alice'
  }, 'Welcome to Call Me Todo. Connecting you to your AI assistant.');
  
  twiml.connect().stream({
    url: `wss://${req.headers.host}/media-stream`
  });

  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle outbound calls for scheduled reminders
app.post('/outbound-call', async (req, res) => {
  const { taskId } = req.body;
  
  // Fetch task details from Supabase
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();
  
  if (error || !task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say({
    voice: 'alice'
  }, `Hello! This is your Call Me Todo reminder. You have a task: ${task.title}.`);
  
  twiml.connect().stream({
    url: `wss://${req.headers.host}/media-stream`,
    parameters: {
      taskId: taskId,
      userId: task.user_id,
      isReminder: 'true'
    }
  });

  res.type('text/xml');
  res.send(twiml.toString());
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  let streamSid = null;
  let openaiWs = null;
  let phoneNumber = null;
  let taskContext = null;

  ws.on('message', async (data) => {
    const message = JSON.parse(data);

    switch (message.event) {
      case 'start':
        streamSid = message.start.streamSid;
        phoneNumber = message.start.customParameters?.from || 'unknown';
        
        // Check if this is a reminder call
        if (message.start.customParameters?.isReminder === 'true') {
          taskContext = {
            taskId: message.start.customParameters.taskId,
            userId: message.start.customParameters.userId
          };
        }

        console.log(`Stream started: ${streamSid}, Phone: ${phoneNumber}`);
        
        // Connect to OpenAI Realtime API
        openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'realtime=v1'
          }
        });

        openaiWs.on('open', () => {
          console.log('Connected to OpenAI Realtime API');
          
          // Configure the session
          openaiWs.send(JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: SYSTEM_PROMPT,
              voice: VOICE,
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
              tools: [
                {
                  type: 'function',
                  name: 'create_task',
                  description: 'Create a new task for the user',
                  parameters: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', description: 'The task title or description' },
                      scheduled_at: { type: 'string', description: 'ISO 8601 datetime when to remind the user' }
                    },
                    required: ['title', 'scheduled_at']
                  }
                },
                {
                  type: 'function',
                  name: 'list_tasks',
                  description: 'List upcoming tasks for the user',
                  parameters: {
                    type: 'object',
                    properties: {
                      limit: { type: 'number', description: 'Number of tasks to return', default: 5 }
                    }
                  }
                },
                {
                  type: 'function',
                  name: 'complete_task',
                  description: 'Mark a task as complete',
                  parameters: {
                    type: 'object',
                    properties: {
                      task_id: { type: 'string', description: 'The ID of the task to complete' }
                    },
                    required: ['task_id']
                  }
                },
                {
                  type: 'function',
                  name: 'snooze_task',
                  description: 'Snooze a task for later',
                  parameters: {
                    type: 'object',
                    properties: {
                      task_id: { type: 'string', description: 'The ID of the task to snooze' },
                      minutes: { type: 'number', description: 'Number of minutes to snooze', default: 10 }
                    },
                    required: ['task_id']
                  }
                }
              ]
            }
          }));

          // If this is a reminder call, provide context
          if (taskContext) {
            openaiWs.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'system',
                content: [{
                  type: 'text',
                  text: `This is a reminder call for task ID: ${taskContext.taskId}. Ask the user if they want to mark it complete, snooze it, or need help with something else.`
                }]
              }
            }));
          }
          
          // Start the response
          openaiWs.send(JSON.stringify({
            type: 'response.create'
          }));
        });

        openaiWs.on('message', async (data) => {
          const response = JSON.parse(data);
          
          switch (response.type) {
            case 'response.audio.delta':
              // Forward audio to Twilio
              if (response.delta) {
                ws.send(JSON.stringify({
                  event: 'media',
                  streamSid: streamSid,
                  media: {
                    payload: response.delta
                  }
                }));
              }
              break;

            case 'response.function_call_arguments.done':
              // Handle function calls
              const functionName = response.name;
              const args = JSON.parse(response.arguments);
              
              let result = await handleFunctionCall(functionName, args, phoneNumber, taskContext);
              
              // Send function result back to OpenAI
              openaiWs.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: response.call_id,
                  output: JSON.stringify(result)
                }
              }));
              
              // Continue the conversation
              openaiWs.send(JSON.stringify({
                type: 'response.create'
              }));
              break;

            case 'response.done':
              // Response completed
              console.log('OpenAI response completed');
              break;

            case 'error':
              console.error('OpenAI error:', response.error);
              break;
          }
        });

        openaiWs.on('error', (error) => {
          console.error('OpenAI WebSocket error:', error);
        });

        openaiWs.on('close', () => {
          console.log('OpenAI WebSocket closed');
        });
        
        connections.set(streamSid, { ws, openaiWs, phoneNumber });
        break;

      case 'media':
        // Forward audio from Twilio to OpenAI
        if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
          openaiWs.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: message.media.payload
          }));
        }
        break;

      case 'stop':
        console.log(`Stream stopped: ${streamSid}`);
        if (openaiWs) {
          openaiWs.close();
        }
        connections.delete(streamSid);
        break;
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    if (openaiWs) {
      openaiWs.close();
    }
    if (streamSid) {
      connections.delete(streamSid);
    }
  });
});

// Function call handler
async function handleFunctionCall(functionName, args, phoneNumber, context) {
  console.log(`Executing function: ${functionName}`, args);
  
  try {
    // Get user by phone number (you might want to implement proper user lookup)
    // For now, we'll use the context if available
    let userId = context?.userId;
    
    if (!userId && phoneNumber !== 'unknown') {
      // Look up user by phone number in your user profile table
      // This is a simplified example - you'd need to implement proper user lookup
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', phoneNumber)
        .single();
      
      userId = user?.id;
    }

    switch (functionName) {
      case 'create_task':
        if (!userId) {
          return { success: false, error: 'User not found. Please sign up first.' };
        }
        
        const { data: newTask, error: createError } = await supabase
          .from('tasks')
          .insert({
            user_id: userId,
            title: args.title,
            phone_number: phoneNumber,
            scheduled_at: args.scheduled_at,
            status: 'pending'
          })
          .select()
          .single();
        
        if (createError) {
          return { success: false, error: createError.message };
        }
        
        return { 
          success: true, 
          message: `Task "${args.title}" created successfully. I'll remind you at ${new Date(args.scheduled_at).toLocaleString()}.`,
          task: newTask
        };

      case 'list_tasks':
        if (!userId) {
          return { success: false, error: 'User not found.' };
        }
        
        const { data: tasks, error: listError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .order('scheduled_at', { ascending: true })
          .limit(args.limit || 5);
        
        if (listError) {
          return { success: false, error: listError.message };
        }
        
        if (tasks.length === 0) {
          return { success: true, message: 'You have no upcoming tasks.' };
        }
        
        const taskList = tasks.map((t, i) => 
          `${i + 1}. ${t.title} - scheduled for ${new Date(t.scheduled_at).toLocaleString()}`
        ).join('\n');
        
        return { 
          success: true, 
          message: `Here are your upcoming tasks:\n${taskList}`,
          tasks: tasks
        };

      case 'complete_task':
        const { error: completeError } = await supabase
          .from('tasks')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', args.task_id || context?.taskId);
        
        if (completeError) {
          return { success: false, error: completeError.message };
        }
        
        return { 
          success: true, 
          message: 'Task marked as complete. Great job!'
        };

      case 'snooze_task':
        const taskId = args.task_id || context?.taskId;
        
        // Get current task
        const { data: task } = await supabase
          .from('tasks')
          .select('scheduled_at')
          .eq('id', taskId)
          .single();
        
        if (!task) {
          return { success: false, error: 'Task not found.' };
        }
        
        // Calculate new time
        const newTime = new Date(task.scheduled_at);
        newTime.setMinutes(newTime.getMinutes() + (args.minutes || 10));
        
        const { error: snoozeError } = await supabase
          .from('tasks')
          .update({ 
            scheduled_at: newTime.toISOString(),
            status: 'snoozed'
          })
          .eq('id', taskId);
        
        if (snoozeError) {
          return { success: false, error: snoozeError.message };
        }
        
        return { 
          success: true, 
          message: `Task snoozed for ${args.minutes || 10} minutes. I'll call you back at ${newTime.toLocaleString()}.`
        };

      default:
        return { success: false, error: `Unknown function: ${functionName}` };
    }
  } catch (error) {
    console.error('Function call error:', error);
    return { success: false, error: error.message };
  }
}

const PORT = process.env.VOICE_SERVER_PORT || 5050;
server.listen(PORT, () => {
  console.log(`Voice server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/incoming-call`);
  console.log(`WebSocket URL: ws://localhost:${PORT}/media-stream`);
});