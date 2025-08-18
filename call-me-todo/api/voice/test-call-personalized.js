// Personalized test call with OpenAI and user info
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  console.log(`Personalized test call ${req.method} request`);
  
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
  let userName = '';
  
  // Get phone number from request (Twilio sends this)
  const to = req.body?.To || req.query?.to || '';
  
  // Try to get user info from database
  if (to && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
      
      // Look up user by phone number
      const { data: phoneData } = await supabase
        .from('phone_numbers')
        .select('user_id')
        .eq('phone_number', to)
        .single();
      
      if (phoneData?.user_id) {
        // Get user email (as a proxy for name)
        const { data: userData } = await supabase
          .from('auth.users')
          .select('email')
          .eq('id', phoneData.user_id)
          .single();
        
        if (userData?.email) {
          // Extract name from email (before @)
          userName = userData.email.split('@')[0].replace(/[._-]/g, ' ');
          // Capitalize first letter
          userName = userName.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }
  
  // Get personalized response from OpenAI
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (openaiApiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',  // Using GPT-4o mini for better quality
          messages: [
            {
              role: 'system',
              content: `You are a warm, friendly AI assistant for Call Me Todo. Generate a personalized greeting for a test call.
              ${userName ? `The user's name is ${userName}. Use their name naturally in the greeting.` : 'You don\'t know the user\'s name yet.'}
              Be enthusiastic and conversational, like greeting a friend.
              Mention you're excited to help them manage tasks through natural conversation.
              Keep it to 2-3 short, natural sentences.
              Example with name: "Hi Sarah! It's wonderful to hear from you. I'm your Call Me Todo assistant, ready to help you stay on top of your tasks through our conversation."
              Example without name: "Hello there! Great to connect with you. I'm your Call Me Todo assistant, excited to help you manage your tasks just by talking."`
            },
            {
              role: 'user',
              content: 'Generate a warm, personalized greeting'
            }
          ],
          max_tokens: 150,
          temperature: 0.8
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        responseText = data.choices[0].message.content;
        console.log('OpenAI personalized response:', responseText);
      } else {
        // Fallback with name if available
        responseText = userName 
          ? `Hi ${userName}! It's great to connect with you. I'm your Call Me Todo assistant, ready to help you manage your tasks through our conversation.`
          : "Hello! It's wonderful to hear from you. I'm your Call Me Todo assistant, excited to help you stay organized through natural conversation.";
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      responseText = userName 
        ? `Hi ${userName}! Welcome to Call Me Todo. I'm here to help you manage your tasks.`
        : "Hello! Welcome to Call Me Todo. I'm here to help you manage your tasks through conversation.";
    }
  } else {
    // No API key, use fallback
    responseText = userName 
      ? `Hi ${userName}! This is your Call Me Todo assistant. I can help you manage tasks through phone conversations.`
      : "Hello! This is your Call Me Todo assistant. I can help you manage tasks through natural conversation.";
  }
  
  // Generate TwiML response with high-quality neural voice
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural" language="en-US">
    <prosody rate="medium" pitch="+2%">
      ${responseText}
    </prosody>
  </Say>
  <Pause length="1"/>
  <Say voice="Polly.Joanna-Neural" language="en-US">
    <prosody rate="medium" pitch="+2%">
      This was a test call. Have a wonderful day!
    </prosody>
  </Say>
</Response>`;
  
  res.status(200);
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(twiml);
}