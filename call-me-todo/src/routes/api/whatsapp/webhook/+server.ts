import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import twilio from 'twilio';
import { createSupabaseClient } from '$lib/supabase';
import { WhatsAppMessageProcessor } from '$lib/services/whatsapp/message-processor';
import { WhatsAppSessionManager } from '$lib/services/whatsapp/session-manager';

// Validate Twilio webhook signature for security
function validateTwilioSignature(request: Request, authToken: string): boolean {
  // In development, skip validation
  if (env.NODE_ENV === 'development') {
    return true;
  }

  const signature = request.headers.get('X-Twilio-Signature');
  if (!signature) {
    console.error('Missing X-Twilio-Signature header');
    return false;
  }

  // TODO: Implement proper signature validation
  // This requires the full URL and request body
  return true;
}

export const POST: RequestHandler = async ({ request, url }) => {
  console.log('📱 WhatsApp webhook received');

  // Validate the request is from Twilio
  if (!validateTwilioSignature(request, env.TWILIO_AUTH_TOKEN)) {
    console.error('Invalid Twilio signature');
    return error(401, 'Unauthorized');
  }

  try {
    // Parse the webhook data
    const formData = await request.formData();
    const webhookData: any = {};
    for (const [key, value] of formData.entries()) {
      webhookData[key] = value;
    }

    console.log('📱 Webhook data:', {
      from: webhookData.From,
      to: webhookData.To,
      messageType: webhookData.MessageType || 'text',
      body: webhookData.Body?.substring(0, 100),
    });

    // Extract key information
    const from = webhookData.From?.replace('whatsapp:', ''); // Remove WhatsApp prefix
    const to = webhookData.To?.replace('whatsapp:', '');
    const messageBody = webhookData.Body;
    const messageSid = webhookData.MessageSid;
    const mediaUrl = webhookData.MediaUrl0; // First media attachment if any
    const mediaContentType = webhookData.MediaContentType0;
    const numMedia = parseInt(webhookData.NumMedia || '0');

    // Validate required fields
    if (!from || !to) {
      console.error('Missing required fields: from or to');
      return error(400, 'Missing required fields');
    }

    // Initialize services
    const supabase = createSupabaseClient();
    const sessionManager = new WhatsAppSessionManager(supabase);
    const messageProcessor = new WhatsAppMessageProcessor(supabase, sessionManager);

    // Get or create session for this phone number
    const session = await sessionManager.getOrCreateSession(from);
    console.log('📱 Session:', {
      id: session.id,
      type: session.sessionType,
      userId: session.userId,
      tempTaskCount: session.tempTaskCount,
    });

    // Process the message based on type
    let response;
    if (numMedia > 0 && mediaUrl) {
      // Handle media message (photo, document, etc.)
      console.log('📷 Processing media message:', {
        mediaUrl,
        mediaContentType,
        numMedia,
      });

      response = await messageProcessor.processMediaMessage({
        sessionId: session.id,
        phoneNumber: from,
        mediaUrl,
        mediaContentType,
        caption: messageBody,
      });
    } else if (messageBody) {
      // Handle text message
      console.log('💬 Processing text message');
      response = await messageProcessor.processTextMessage({
        sessionId: session.id,
        phoneNumber: from,
        message: messageBody,
      });
    } else {
      // Handle other message types (e.g., location, contact)
      console.log('❓ Unknown message type');
      response = {
        message: "I can help you manage tasks! Send me a task, photo, or voice note to get started.",
      };
    }

    // Log the conversation
    await messageProcessor.logConversation({
      sessionId: session.id,
      phoneNumber: from,
      messageType: 'inbound',
      messageFormat: numMedia > 0 ? 'image' : 'text',
      messageContent: messageBody || 'Media message',
    });

    // Send response back via Twilio
    if (response.message) {
      await sendWhatsAppMessage(from, response.message, response.mediaUrl);
    }

    // Return empty response to acknowledge webhook
    return new Response('', { status: 200 });

  } catch (err) {
    console.error('❌ Error processing WhatsApp webhook:', err);
    
    // Try to send error message to user
    try {
      const formData = await request.formData();
      const from = formData.get('From')?.toString()?.replace('whatsapp:', '');
      if (from) {
        await sendWhatsAppMessage(
          from,
          "Sorry, I encountered an error processing your message. Please try again or contact support if the issue persists."
        );
      }
    } catch (sendErr) {
      console.error('Failed to send error message:', sendErr);
    }

    return error(500, 'Internal server error');
  }
};

// GET endpoint for webhook verification (required by WhatsApp/Twilio)
export const GET: RequestHandler = async ({ url }) => {
  // This is typically used for webhook verification
  const challenge = url.searchParams.get('hub.challenge');
  const verifyToken = url.searchParams.get('hub.verify_token');
  
  // Verify the token matches what we expect
  if (verifyToken === env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified');
    return new Response(challenge || 'OK', { status: 200 });
  }

  return error(403, 'Forbidden');
};

// Helper function to send WhatsApp messages via Twilio
async function sendWhatsAppMessage(to: string, message: string, mediaUrl?: string) {
  try {
    const accountSid = env.TWILIO_ACCOUNT_SID;
    const authToken = env.TWILIO_AUTH_TOKEN;
    const fromNumber = env.TWILIO_WHATSAPP_NUMBER || env.TWILIO_PHONE_NUMBER; // Use WhatsApp number if configured

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured');
    }

    const client = twilio(accountSid, authToken);

    const messageOptions: any = {
      from: `whatsapp:${fromNumber.replace('whatsapp:', '')}`,
      to: `whatsapp:${to.replace('whatsapp:', '')}`,
      body: message,
    };

    // Add media if provided
    if (mediaUrl) {
      messageOptions.mediaUrl = [mediaUrl];
    }

    const result = await client.messages.create(messageOptions);
    console.log('✅ WhatsApp message sent:', result.sid);
    return result;
  } catch (err) {
    console.error('❌ Failed to send WhatsApp message:', err);
    throw err;
  }
}