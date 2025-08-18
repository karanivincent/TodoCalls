// Handle incoming calls with OpenAI conversation
export default async function handler(req, res) {
  console.log(`Incoming call ${req.method} request`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Twilio-Signature');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  // Parse Twilio request
  let speechResult = '';
  let callSid = '';
  
  if (req.method === 'POST' && req.body) {
    speechResult = req.body.SpeechResult || '';
    callSid = req.body.CallSid || '';
    console.log('User said:', speechResult);
  }
  
  let responseText = '';
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (openaiApiKey && speechResult) {
    try {
      // Get AI response based on user input
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
              content: `You are a helpful AI assistant for TeliTask, a task management app. 
              You're having a phone conversation with a user. 
              Help them manage their tasks - they can create tasks, list tasks, or mark tasks complete.
              Be conversational, friendly, and concise (under 2 sentences).
              If they want to create a task, confirm what they want and when.
              If they want to list tasks, tell them their upcoming tasks.
              Always be helpful and natural in conversation.`
            },
            {
              role: 'user',
              content: speechResult
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        responseText = data.choices[0].message.content;
        console.log('AI response:', responseText);
      } else {
        responseText = "I'm sorry, I didn't quite catch that. Could you please repeat what you'd like to do with your tasks?";
      }
    } catch (error) {
      console.error('OpenAI error:', error);
      responseText = "I'm having trouble understanding right now. Please try again.";
    }
  } else if (!speechResult) {
    // Initial greeting
    responseText = "Hello! I'm your TeliTask assistant. How can I help you with your tasks today? You can say things like 'create a new task' or 'what are my tasks for today'.";
  } else {
    // No API key but user spoke
    responseText = "I heard you say: " + speechResult + ". However, I need OpenAI configured to help you manage tasks.";
  }
  
  // Generate TwiML with gather for continuous conversation
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="3" speechTimeout="auto" action="/api/voice/incoming" method="POST">
    <Say voice="alice" language="en-US">${responseText}</Say>
  </Gather>
  <Say voice="alice" language="en-US">I didn't hear anything. Goodbye!</Say>
</Response>`;
  
  res.status(200);
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(twiml);
}