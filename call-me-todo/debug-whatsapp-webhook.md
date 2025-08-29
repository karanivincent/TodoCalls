# WhatsApp Webhook Debugging Guide

## Current Issue
The webhook endpoint is deployed and working, but Meta is not sending messages to it when you send WhatsApp messages.

## Common Issues with Test Numbers

### 1. **Test Number Limitations**
WhatsApp test numbers have restrictions:
- Can only send messages to up to 5 verified phone numbers
- Your phone number must be added to the "To" list in Meta dashboard

### 2. **Add Your Phone Number to Test Recipients**

1. Go to Meta App Dashboard
2. Navigate to **WhatsApp > API Setup**
3. Find the section **"To" Phone Numbers**
4. Click **"Add phone number"**
5. Enter your personal WhatsApp number (the one you're testing from)
6. Verify it with the code sent via WhatsApp

### 3. **Verify Webhook Subscription**

In Meta Dashboard:
1. Go to **WhatsApp > Configuration**
2. Check that webhook shows:
   - URL: `https://telitask.com/api/whatsapp/webhook-meta`
   - Status: **Verified** ✅
3. Make sure these fields are subscribed:
   - ✅ messages
   - ✅ message_status
   - ✅ message_template_status_update

### 4. **Test the Flow**

After adding your number to the test recipients:

1. Send a WhatsApp message to **+1 555 193 2671**
2. Check Vercel logs immediately:
   ```bash
   vercel logs api/whatsapp/webhook-meta --follow
   ```

### 5. **Alternative Test Method**

If webhooks still don't work, test sending a message FROM your app:

```bash
# Send a test message to your phone
curl -X POST https://graph.facebook.com/v22.0/775743698957535/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_PHONE_NUMBER",
    "type": "text",
    "text": {"body": "Test from TeliTask!"}
  }'
```

## Quick Checklist

- [ ] Your phone number is added to "To" recipients in Meta dashboard
- [ ] Your phone number is verified
- [ ] Webhook URL is verified in Meta dashboard
- [ ] Webhook fields are subscribed (messages, message_status)
- [ ] Database tables exist in Supabase
- [ ] Environment variables are set in Vercel

## Important Note

With test numbers, you MUST add and verify your phone number as a test recipient first. This is a Meta requirement for test mode.