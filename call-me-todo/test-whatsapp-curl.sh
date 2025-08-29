#!/bin/bash

# WhatsApp Business API Test Script using curl
# This script sends test messages directly to your webhook

WEBHOOK_URL="${1:-http://localhost:5173/api/whatsapp/webhook-meta}"
PHONE_NUMBER="${2:-+1234567890}"

echo "🧪 WhatsApp Webhook Test Script"
echo "================================"
echo "Webhook URL: $WEBHOOK_URL"
echo "Test Phone: $PHONE_NUMBER"
echo ""

# Function to send a test message
send_test_message() {
    local message="$1"
    local message_type="${2:-text}"
    
    echo "📤 Sending: $message"
    
    # Create the webhook payload matching Meta's format
    PAYLOAD=$(cat <<EOF
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "7781763482411982",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551932671",
              "phone_number_id": "775743698957535"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Test User"
                },
                "wa_id": "${PHONE_NUMBER//[^0-9]/}"
              }
            ],
            "messages": [
              {
                "from": "${PHONE_NUMBER//[^0-9]/}",
                "id": "wamid.$(uuidgen || echo 'test_id')",
                "timestamp": "$(date +%s)",
                "type": "$message_type",
                "text": {
                  "body": "$message"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
EOF
)
    
    # Send the request
    RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")
    
    if [ $? -eq 0 ]; then
        echo "✅ Sent successfully"
        echo "Response: $RESPONSE"
    else
        echo "❌ Failed to send"
    fi
    echo ""
}

# Function to test webhook verification
test_webhook_verification() {
    echo "🔐 Testing webhook verification..."
    
    VERIFY_TOKEN="telitask_verify_token_2024"
    CHALLENGE="test_challenge_123"
    
    RESPONSE=$(curl -s -X GET "$WEBHOOK_URL?hub.mode=subscribe&hub.verify_token=$VERIFY_TOKEN&hub.challenge=$CHALLENGE")
    
    if [ "$RESPONSE" = "$CHALLENGE" ]; then
        echo "✅ Webhook verification passed"
    else
        echo "❌ Webhook verification failed"
        echo "Expected: $CHALLENGE"
        echo "Got: $RESPONSE"
    fi
    echo ""
}

# Function to send image message
send_image_message() {
    echo "📷 Sending image message..."
    
    PAYLOAD=$(cat <<EOF
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "7781763482411982",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551932671",
              "phone_number_id": "775743698957535"
            },
            "messages": [
              {
                "from": "${PHONE_NUMBER//[^0-9]/}",
                "id": "wamid.image_test",
                "timestamp": "$(date +%s)",
                "type": "image",
                "image": {
                  "caption": "Here's my receipt",
                  "mime_type": "image/jpeg",
                  "sha256": "test_sha256",
                  "id": "media_id_123"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
EOF
)
    
    RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")
    
    echo "Response: $RESPONSE"
    echo ""
}

# Main test sequence
echo "Starting test sequence..."
echo "========================="
echo ""

# Test 1: Webhook verification
test_webhook_verification

# Test 2: Simple greeting
send_test_message "Hello"

# Test 3: Create task
send_test_message "Remind me to call dentist tomorrow at 3pm"

# Test 4: List tasks
send_test_message "What tasks do I have today?"

# Test 5: Help command
send_test_message "Help"

# Test 6: Complete task
send_test_message "Done with grocery shopping"

# Test 7: Image message
send_image_message

echo "========================="
echo "✅ Test sequence complete!"
echo ""
echo "Check your server logs to see how messages were processed."
echo ""
echo "To test with different webhook URL or phone number:"
echo "  ./test-whatsapp-curl.sh https://your-domain.com/api/whatsapp/webhook-meta +1234567890"