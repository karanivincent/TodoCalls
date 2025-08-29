# WhatsApp Business API Quick Start Guide (Meta Direct)

## Your Test Credentials

Based on your screenshot, you have:
- **Test Number**: +1 555 193 2671
- **Phone Number ID**: 775743698957535  
- **WhatsApp Business Account ID**: 7781763482411982

## Step 1: Generate Access Token

1. Click the "Generate access token" button in the Meta dashboard
2. Select your WhatsApp Business Account
3. Copy the generated token (it will look like: `EAAxx...`)

## Step 2: Configure Environment Variables

Add these to your `.env` file:

```bash
# WhatsApp Test Credentials
WHATSAPP_TEST_NUMBER=+15551932671
WHATSAPP_BUSINESS_ACCOUNT_ID=7781763482411982
WHATSAPP_PHONE_NUMBER_ID=775743698957535

# Add your access token here (from Step 1)
WHATSAPP_ACCESS_TOKEN=YOUR_ACCESS_TOKEN_HERE

# Webhook configuration
WHATSAPP_WEBHOOK_VERIFY_TOKEN=telitask_verify_token_2024
WEBHOOK_BASE_URL=https://telitask.com  # Or your ngrok URL for testing

# Graph API Version
GRAPH_API_VERSION=v22.0
```

## Step 3: Configure Webhook (Step 3 from screenshot)

In the Meta dashboard, you'll need to configure webhooks:

1. **Callback URL**: 
   - Production: `https://telitask.com/api/whatsapp/webhook-meta`
   - Local testing: `https://YOUR_NGROK_ID.ngrok.io/api/whatsapp/webhook-meta`

2. **Verify Token**: `telitask_verify_token_2024`

3. **Webhook Fields** to subscribe:
   - `messages` - For incoming messages
   - `message_status` - For delivery status
   - `message_template_status_update` - For template approvals

## Step 4: Test Your Setup

### Option A: Send a Test Message from Meta Dashboard

Use the code snippet shown in your screenshot:

```bash
curl -i -X POST \
  https://graph.facebook.com/v22.0/775743698957535/messages \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ 
    "messaging_product": "whatsapp",
    "to": "YOUR_PHONE_NUMBER",
    "type": "template",
    "template": { 
      "name": "hello_world",
      "language": { "code": "en_US" }
    }
  }'
```

### Option B: Use Our Test Script

```bash
# First, set up your environment
npm install

# Run the setup script
node setup-whatsapp-meta.js

# Send a test message (replace with your phone number)
node setup-whatsapp-meta.js +1234567890
```

### Option C: Test Webhook Locally

```bash
# Test webhook verification
curl "http://localhost:5173/api/whatsapp/webhook-meta?hub.mode=subscribe&hub.verify_token=telitask_verify_token_2024&hub.challenge=test"

# Test incoming message
./test-whatsapp-curl.sh http://localhost:5173/api/whatsapp/webhook-meta +1234567890
```

## Step 5: Deploy to Production

1. **Deploy to Vercel**:
```bash
vercel --prod
```

2. **Update webhook URL** in Meta dashboard to your production URL

3. **Test with real messages**:
   - Send a WhatsApp message to +1 555 193 2671
   - Check your server logs for incoming webhooks

## Testing Conversation Flow

Once configured, test these messages:

1. **Simple task**: "Remind me to call mom at 3pm"
2. **List tasks**: "What do I have today?"
3. **Help**: "Help"
4. **Complete task**: "Done with task 1"
5. **Send photo**: Send any image with caption "Receipt from lunch"

## Troubleshooting

### Webhook Not Receiving Messages

1. Check webhook URL is correct and publicly accessible
2. Verify token matches in both Meta dashboard and `.env`
3. Check Vercel logs: `vercel logs`

### Access Token Issues

1. Token expires after 60 days for test numbers
2. Generate a new token from Meta dashboard
3. Update `.env` with new token

### Message Not Sending

Check the response from Meta API:
```bash
# Enable debug mode in your webhook
console.log('Meta API Response:', response);
```

Common errors:
- `#131030`: Recipient has not accepted conversation
- `#131056`: Rate limit exceeded
- `#100`: Invalid access token

## Local Development with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start your dev server
npm run dev

# In another terminal, expose it
ngrok http 5173

# Use the ngrok URL in Meta dashboard
# Example: https://abc123.ngrok.io/api/whatsapp/webhook-meta
```

## Next Steps

1. **Create Message Templates** in Meta Business Suite for notifications
2. **Implement OCR** for photo processing (Google Vision API or similar)
3. **Add voice note transcription** using Whisper API
4. **Set up automated testing** with the test scripts
5. **Monitor usage** in Meta dashboard analytics

## Support

- Meta WhatsApp Docs: https://developers.facebook.com/docs/whatsapp
- API Status: https://developers.facebook.com/status/
- Webhook Debugger: Meta Dashboard > Webhooks > View Details

## Rate Limits

For test numbers:
- 250 messages per day
- 50 unique recipients
- Templates required after 24 hours of no user interaction

For production:
- Unlimited messages within 24-hour conversation window
- Template messages based on quality rating
- See: https://developers.facebook.com/docs/whatsapp/pricing