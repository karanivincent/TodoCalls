#!/bin/bash

echo "🧪 Testing WhatsApp Integration on Production"
echo "============================================="
echo ""

# Test 1: Webhook Verification
echo "1️⃣ Testing webhook verification..."
VERIFY_RESPONSE=$(curl -s "https://telitask.com/api/whatsapp/webhook-meta?hub.mode=subscribe&hub.verify_token=telitask_verify_token_2024&hub.challenge=test123")
if [ "$VERIFY_RESPONSE" = "test123" ]; then
    echo "✅ Webhook verification: WORKING"
else
    echo "❌ Webhook verification: FAILED"
    echo "   Response: $VERIFY_RESPONSE"
fi
echo ""

# Test 2: Send a test webhook message
echo "2️⃣ Sending test message to webhook..."
TEST_PAYLOAD='{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "7781763482411982",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551932671",
          "phone_number_id": "775743698957535"
        },
        "contacts": [{
          "profile": {"name": "Test User"},
          "wa_id": "1234567890"
        }],
        "messages": [{
          "from": "1234567890",
          "id": "test_message_id",
          "timestamp": "'$(date +%s)'",
          "type": "text",
          "text": {"body": "Test message from script"}
        }]
      },
      "field": "messages"
    }]
  }]
}'

WEBHOOK_RESPONSE=$(curl -s -X POST "https://telitask.com/api/whatsapp/webhook-meta" \
    -H "Content-Type: application/json" \
    -d "$TEST_PAYLOAD")

if [ "$WEBHOOK_RESPONSE" = '{"status":"ok"}' ]; then
    echo "✅ Webhook message processing: WORKING"
else
    echo "⚠️  Webhook response: $WEBHOOK_RESPONSE"
fi
echo ""

# Test 3: Check if we can reach the API
echo "3️⃣ Testing API accessibility..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://telitask.com/api/whatsapp/webhook-meta")
if [ "$API_STATUS" = "405" ] || [ "$API_STATUS" = "200" ]; then
    echo "✅ API endpoint: ACCESSIBLE (Status: $API_STATUS)"
else
    echo "❌ API endpoint: Status $API_STATUS"
fi
echo ""

echo "============================================="
echo "📝 Next Steps:"
echo ""
echo "1. Go to Meta Business Suite:"
echo "   https://business.facebook.com/settings/whatsapp-business-accounts/7781763482411982"
echo ""
echo "2. Navigate to WhatsApp Manager > Phone numbers"
echo ""
echo "3. Click on your test number (+1 555 193 2671)"
echo ""
echo "4. Go to 'Configuration' tab"
echo ""
echo "5. In the Webhook section, set:"
echo "   Callback URL: https://telitask.com/api/whatsapp/webhook-meta"
echo "   Verify token: telitask_verify_token_2024"
echo ""
echo "6. Click 'Verify and save'"
echo ""
echo "7. Make sure these webhook fields are selected:"
echo "   ✓ messages"
echo "   ✓ message_status"
echo ""
echo "8. After setup, send a WhatsApp message to +1 555 193 2671"
echo ""
echo "To check logs after sending a message:"
echo "vercel logs api/whatsapp/webhook-meta --follow"