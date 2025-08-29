# WhatsApp Integration Deployment Guide

## ✅ Current Status

Your WhatsApp Business API is configured with:
- **Test Number**: +1 555 193 2671
- **Access Token**: Configured in `.env`
- **Connection**: Verified and working ✅

## 📋 Deployment Steps

### Step 1: Run Database Migration

Go to your Supabase Dashboard and run this SQL:

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/sjcnyewjhbojwopsdbjc/sql)
2. Create a new query
3. Copy the entire contents of `drizzle/migrations/0002_whatsapp_integration.sql`
4. Run the query

This creates:
- `whatsapp_sessions` table
- `whatsapp_media` table  
- `whatsapp_templates` table
- `whatsapp_conversations` table
- Required indexes and functions

### Step 2: Deploy to Vercel

```bash
# Build and deploy
vercel --prod
```

Make sure these environment variables are set in Vercel:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `GRAPH_API_VERSION`

### Step 3: Configure Webhook in Meta Dashboard

1. Go to your [Meta App Dashboard](https://developers.facebook.com/apps/)
2. Navigate to **WhatsApp > Configuration**
3. In the **Webhooks** section:

   **Callback URL**: 
   ```
   https://telitask.com/api/whatsapp/webhook-meta
   ```

   **Verify Token**:
   ```
   telitask_verify_token_2024
   ```

4. Click **Verify and Save**

5. Subscribe to these webhook fields:
   - ✅ `messages`
   - ✅ `message_status`
   - ✅ `message_template_status_update`

### Step 4: Test the Integration

#### Test 1: Send a message using curl

```bash
curl -X POST https://graph.facebook.com/v22.0/775743698957535/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_PHONE_NUMBER",
    "type": "text",
    "text": {"body": "Hello from TeliTask! Your WhatsApp integration is working."}
  }'
```

#### Test 2: WhatsApp to TeliTask

1. Save +1 555 193 2671 in your contacts
2. Send a WhatsApp message: "Hello"
3. You should receive a welcome message

#### Test 3: Create a task

Send: "Remind me to call dentist tomorrow at 3pm"

The bot should:
1. Parse your task
2. Confirm creation
3. Schedule a reminder

### Step 5: Monitor Logs

```bash
# View Vercel function logs
vercel logs --follow

# Or check specific function
vercel logs api/whatsapp/webhook-meta
```

## 🧪 Testing Locally

### With ngrok (recommended)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Expose with ngrok  
ngrok http 5173

# Use ngrok URL in Meta dashboard
# Example: https://abc123.ngrok.io/api/whatsapp/webhook-meta
```

### Test webhook locally

```bash
# Test verification
curl "http://localhost:5173/api/whatsapp/webhook-meta?hub.mode=subscribe&hub.verify_token=telitask_verify_token_2024&hub.challenge=test"

# Test message
./test-whatsapp-curl.sh http://localhost:5173/api/whatsapp/webhook-meta
```

## 📱 Supported Messages

### Text Commands
- "Help" - Show available commands
- "Add task: [description]" - Create a task
- "List tasks" - Show today's tasks
- "Done with [task]" - Complete a task
- "Sign up" - Create account (for guests)

### Media Support
- **Photos**: Send receipts, handwritten lists, business cards
- **Documents**: PDFs and other documents
- **Voice Notes**: Coming soon
- **Location**: Coming soon

## 🔍 Troubleshooting

### Webhook not receiving messages

1. Check webhook URL is correct in Meta dashboard
2. Verify token matches in both places
3. Check Vercel deployment status
4. Look for errors in Vercel logs

### Access token errors

Common error codes:
- `#100`: Invalid token - regenerate in Meta dashboard
- `#131030`: Recipient hasn't initiated conversation
- `#131056`: Rate limit exceeded
- `#368`: Message temporarily blocked

### Database issues

If tables don't exist:
1. Run the migration SQL in Supabase
2. Check for any error messages
3. Verify tables were created: `whatsapp_sessions`, `whatsapp_media`, etc.

## 📊 Monitoring

### Check webhook status
```bash
curl https://telitask.com/api/whatsapp/webhook-meta
```

### View message logs in Supabase
```sql
-- Recent conversations
SELECT * FROM whatsapp_conversations 
ORDER BY created_at DESC 
LIMIT 20;

-- Active sessions
SELECT * FROM whatsapp_sessions 
WHERE session_status = 'active';

-- Media uploads
SELECT * FROM whatsapp_media 
ORDER BY created_at DESC;
```

## 🚀 Next Steps

1. **Enable OCR**: Add Google Vision API for receipt/document processing
2. **Voice Notes**: Implement Whisper API for transcription
3. **Templates**: Create message templates in Meta Business Suite
4. **Analytics**: Set up monitoring dashboard
5. **Scaling**: Implement queue system for high volume

## 📞 Support

- Meta WhatsApp Support: https://business.facebook.com/business/help
- API Documentation: https://developers.facebook.com/docs/whatsapp
- Vercel Support: https://vercel.com/help

Your WhatsApp integration is ready to deploy! 🎉