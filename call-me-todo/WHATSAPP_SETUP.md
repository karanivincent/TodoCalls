# WhatsApp Business API Integration Setup

This guide explains how to set up and use the WhatsApp Business API integration for TeliTask.

## Overview

The WhatsApp integration allows users to:
- Create and manage tasks via WhatsApp messages
- Send photos (receipts, handwritten lists, business cards) for automatic task extraction
- Receive task reminders via WhatsApp
- Access TeliTask without opening the web app

## Prerequisites

1. **Twilio Account** with WhatsApp capabilities
2. **WhatsApp Business Account** (or use Twilio Sandbox for testing)
3. **Supabase** project with proper tables
4. **Vercel** deployment (or other hosting with HTTPS)

## Quick Start

### 1. Database Setup

Run the migration to create WhatsApp tables:

```bash
# Apply the WhatsApp migration
psql $DATABASE_URL < drizzle/migrations/0002_whatsapp_integration.sql
```

### 2. Environment Variables

Add these to your `.env` file:

```env
# Existing Twilio credentials
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# WhatsApp specific
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Sandbox number or your production number
WHATSAPP_VERIFY_TOKEN=your_random_verify_token
WEBHOOK_BASE_URL=https://your-domain.com

# Optional: OCR service credentials (for image processing)
# GOOGLE_VISION_API_KEY=your_api_key
# or
# AZURE_COMPUTER_VISION_KEY=your_key
# AZURE_COMPUTER_VISION_ENDPOINT=your_endpoint
```

### 3. Run Setup Script

```bash
npm install
node setup-whatsapp.js
```

This will:
- Verify your Twilio connection
- Create message templates in the database
- Display webhook URLs for configuration

### 4. Configure Twilio Webhook

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to Messaging > Try it out > Send a WhatsApp message
3. For Sandbox:
   - Find your sandbox configuration
   - Set webhook URL: `https://your-domain.com/api/whatsapp/webhook`
4. For Production:
   - Configure your WhatsApp sender
   - Set webhook URL in your Messaging Service

### 5. Test the Integration

#### Using Twilio Sandbox:
1. Add `+1 415 523 8886` to your contacts
2. Send `join <your-sandbox-keyword>` to activate
3. Send a test message: "Add task: Test WhatsApp integration"

#### Using Production Number:
1. Send a message to your WhatsApp Business number
2. The bot should respond with a welcome message

## Features

### Text Message Commands

- **Create task**: "Remind me to call mom at 3pm"
- **List tasks**: "Show my tasks" or "What do I have today?"
- **Complete task**: "Done with grocery shopping"
- **Help**: "Help" or "What can you do?"
- **Sign up**: "Sign up" (for guest users)

### Photo Processing

Send photos of:
- **Receipts**: Automatically extract amount, vendor, and date
- **Handwritten lists**: Convert to digital tasks
- **Business cards**: Save contact info and create follow-up reminders
- **Screenshots**: Extract relevant information

### Conversation Examples

```
User: "Add three tasks"
Bot: "Sure! What's the first task?"
User: "Buy groceries"
Bot: "When should I remind you?"
User: "6pm today"
Bot: "Got it! What's the second task?"
```

## API Endpoints

### Webhook Endpoint
`POST /api/whatsapp/webhook`
- Receives all WhatsApp messages
- Processes text, images, and voice notes
- Returns appropriate responses

### Status Endpoint
`GET /api/whatsapp/status`
- Health check for WhatsApp integration
- Returns session statistics

### Media Endpoint
`GET /api/whatsapp/media/:userId`
- Retrieves user's uploaded media
- Supports filtering by type and date

## Development Testing

### Local Development with ngrok

1. Install ngrok: `npm install -g ngrok`
2. Start your dev server: `npm run dev`
3. Expose local server: `ngrok http 5173`
4. Use ngrok URL as webhook in Twilio Console

### Test Different Scenarios

```javascript
// Test script for various message types
node test-whatsapp.js

// Send test message
node setup-whatsapp.js +1234567890
```

## Production Deployment

### Vercel Deployment

1. Set environment variables in Vercel Dashboard
2. Deploy: `vercel --prod`
3. Update webhook URL to production domain
4. Test with real WhatsApp number

### Security Considerations

- Webhook signature validation (implemented)
- Rate limiting per phone number
- Automatic session expiry for guests
- Encrypted media storage
- GDPR-compliant data handling

## Monitoring & Analytics

Check WhatsApp metrics in the database:

```sql
-- Active sessions
SELECT COUNT(*) FROM whatsapp_sessions WHERE session_status = 'active';

-- Message volume
SELECT DATE(created_at), COUNT(*) 
FROM whatsapp_conversations 
GROUP BY DATE(created_at);

-- Media uploads
SELECT category, COUNT(*) 
FROM whatsapp_media 
GROUP BY category;
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Check webhook URL in Twilio Console
   - Verify HTTPS certificate
   - Check Vercel function logs

2. **Media processing fails**
   - Ensure Twilio credentials are correct
   - Check media download permissions
   - Verify OCR service credentials

3. **Session expires too quickly**
   - Adjust session expiry in `session-manager.ts`
   - Check database cleanup job

### Debug Mode

Enable debug logging:

```javascript
// In webhook handler
console.log('📱 WhatsApp webhook:', {
  from: webhookData.From,
  body: webhookData.Body,
  media: webhookData.NumMedia
});
```

## Costs

### WhatsApp Pricing (via Twilio)

- **User-initiated conversations**: Free for 24 hours
- **Business-initiated (templates)**: $0.005-$0.08 per conversation
- **Media messages**: Standard rates apply

### Estimated Monthly Costs (1000 users)

- WhatsApp conversations: $50-200
- Media storage: ~$2
- OCR processing: ~$40
- Total: ~$100-250/month

## Next Steps

1. **Enable OCR**: Integrate Google Vision or Azure Computer Vision
2. **Add voice notes**: Process WhatsApp voice messages
3. **Implement templates**: Create approved message templates
4. **Set up broadcasts**: Send bulk notifications
5. **Add analytics**: Track user engagement and task completion

## Support

For issues or questions:
- Check logs: `vercel logs`
- Database queries: Check `whatsapp_sessions` and `whatsapp_conversations`
- Twilio Console: Monitor message logs
- Contact support: support@telitask.com