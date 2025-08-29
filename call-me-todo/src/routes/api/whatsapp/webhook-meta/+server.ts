import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createServiceSupabaseClient } from '$lib/supabase-service';
import { WhatsAppMessageProcessor } from '$lib/services/whatsapp/message-processor';
import { WhatsAppSessionManager } from '$lib/services/whatsapp/session-manager';

// Verify webhook token for Meta WhatsApp Business API
const VERIFY_TOKEN = env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'telitask_verify_token_2024';

// GET endpoint for webhook verification (required by Meta)
export const GET: RequestHandler = async ({ url }) => {
  console.log('📱 WhatsApp webhook verification request received');
  
  // Parse query parameters
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
  console.log('Verification params:', { mode, token: token?.substring(0, 10) + '...', challenge });
  
  // Check if mode and token are correct
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified successfully');
    // Return the challenge to verify the webhook
    return new Response(challenge, { status: 200 });
  }
  
  console.error('❌ Webhook verification failed - invalid token or mode');
  return error(403, 'Forbidden');
};

// POST endpoint to receive messages from WhatsApp
export const POST: RequestHandler = async ({ request }) => {
  console.log('📱 WhatsApp message webhook received');
  
  try {
    // Parse the webhook payload from Meta
    const body = await request.json();
    console.log('Webhook payload:', JSON.stringify(body, null, 2));
    
    // Extract the message details
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    
    if (!value) {
      console.log('No message value in webhook');
      return json({ status: 'ok' });
    }
    
    // Check if this is a message or a status update
    if (value.statuses) {
      // This is a status update (delivered, read, etc.)
      console.log('📊 Status update:', value.statuses);
      return json({ status: 'ok' });
    }
    
    // Process messages
    const messages = value.messages;
    const contacts = value.contacts;
    const metadata = value.metadata;
    
    if (!messages || messages.length === 0) {
      console.log('No messages in webhook');
      return json({ status: 'ok' });
    }
    
    // Initialize services with service role client (bypasses RLS)
    const supabase = createServiceSupabaseClient();
    const sessionManager = new WhatsAppSessionManager(supabase);
    const messageProcessor = new WhatsAppMessageProcessor(supabase, sessionManager);
    
    // Process each message
    for (const message of messages) {
      console.log('Processing message:', {
        from: message.from,
        type: message.type,
        id: message.id,
        timestamp: message.timestamp
      });
      
      const phoneNumber = message.from;
      const messageType = message.type;
      
      // Get or create session
      const session = await sessionManager.getOrCreateSession(phoneNumber);
      console.log('Session:', {
        id: session.id,
        type: session.sessionType,
        userId: session.userId
      });
      
      let response;
      
      // Process based on message type
      switch (messageType) {
        case 'text':
          response = await messageProcessor.processTextMessage({
            sessionId: session.id,
            phoneNumber,
            message: message.text.body
          });
          break;
          
        case 'image':
        case 'document':
          // Handle media messages
          const mediaId = message[messageType].id;
          const caption = message[messageType].caption;
          
          // Get media URL from Meta
          const mediaUrl = await getMediaUrl(mediaId);
          
          response = await messageProcessor.processMediaMessage({
            sessionId: session.id,
            phoneNumber,
            mediaUrl,
            mediaContentType: message[messageType].mime_type,
            caption
          });
          break;
          
        case 'audio':
          // Handle voice notes
          console.log('Voice note received - processing coming soon');
          response = {
            message: "I received your voice note. Voice processing will be available soon!"
          };
          break;
          
        case 'location':
          console.log('Location received:', message.location);
          response = {
            message: "I see you've shared a location. Location-based reminders coming soon!"
          };
          break;
          
        default:
          console.log('Unknown message type:', messageType);
          response = {
            message: "I can help you manage tasks! Send me text, photos, or voice notes."
          };
      }
      
      // Log the conversation
      await messageProcessor.logConversation({
        sessionId: session.id,
        phoneNumber,
        messageType: 'inbound',
        messageFormat: messageType,
        messageContent: message.text?.body || `${messageType} message`
      });
      
      // Send response back via WhatsApp
      if (response.message) {
        await sendWhatsAppMessage(phoneNumber, response.message, metadata.phone_number_id);
      }
    }
    
    // Return 200 OK to acknowledge receipt
    return json({ status: 'ok' });
    
  } catch (err) {
    console.error('❌ Error processing WhatsApp webhook:', err);
    
    // Still return 200 to prevent Meta from retrying
    return json({ status: 'ok', error: 'Internal processing error' });
  }
};

// Helper function to get media URL from Meta
async function getMediaUrl(mediaId: string): Promise<string> {
  try {
    const accessToken = env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = env.GRAPH_API_VERSION || 'v22.0';
    
    // Get media details
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get media: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.url;
    
  } catch (error) {
    console.error('Failed to get media URL:', error);
    throw error;
  }
}

// Helper function to send WhatsApp messages via Meta API
async function sendWhatsAppMessage(to: string, message: string, phoneNumberId: string) {
  try {
    // Get the latest access token
    const accessToken = env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = env.GRAPH_API_VERSION || 'v22.0';
    
    if (!accessToken) {
      throw new Error('WhatsApp access token not configured');
    }
    
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    };
    
    console.log('Sending WhatsApp message:', {
      to,
      messageLength: message.length,
      phoneNumberId
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send message: ${error}`);
    }
    
    const result = await response.json();
    console.log('✅ WhatsApp message sent:', result);
    
    return result;
    
  } catch (err) {
    console.error('❌ Failed to send WhatsApp message:', err);
    throw err;
  }
}

// Helper function to send template messages (for notifications outside 24-hour window)
async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = 'en_US',
  components?: any[]
) {
  try {
    const accessToken = env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = env.GRAPH_API_VERSION || 'v22.0';
    const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
    
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components: components || []
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send template: ${error}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Failed to send template message:', error);
    throw error;
  }
}