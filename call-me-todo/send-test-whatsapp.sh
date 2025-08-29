#!/bin/bash

# Script to send a test WhatsApp message from your app

echo "📱 Send Test WhatsApp Message"
echo "============================="
echo ""

# Get recipient number
read -p "Enter your WhatsApp number (with country code, e.g., +1234567890): " RECIPIENT

# Clean the number
RECIPIENT_CLEAN=$(echo $RECIPIENT | sed 's/[^0-9]//g')

echo ""
echo "Sending test message to: $RECIPIENT"
echo ""

# Your WhatsApp credentials
ACCESS_TOKEN="EAAR8RsVwkA0BPQ5veysO4FZAqNojZBqK8awoxXjZCLqw5YMs4ixzgTZAwewAtMtaRQk4o0wWv4rJ7rjYvZC2BeFBqZCigM2p9EtJCHoSJAN0x2ozk6COgmzawjA5d3RrkZB4z5qZBjI93U2r6DTJ1TgIZBZAZA6GgH5lrYM4U6FJsr5ZALOxBW8o23GtPdWZB548QkqllgUOj3Kiwz71SJXLGIJ81r6mObWF5xmtKAxAlrdFjlWSS9YWz"
PHONE_NUMBER_ID="775743698957535"

# Send the message
RESPONSE=$(curl -s -X POST "https://graph.facebook.com/v22.0/$PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "'$RECIPIENT_CLEAN'",
    "type": "text",
    "text": {
      "body": "🎉 TeliTask WhatsApp Test!\n\nIf you receive this message, the API is working correctly.\n\nNow try replying to test the webhook!"
    }
  }')

# Check response
if echo "$RESPONSE" | grep -q "messages"; then
  echo "✅ Message sent successfully!"
  echo ""
  echo "Check your WhatsApp for the message."
  echo ""
  echo "IMPORTANT: If you receive this message but can't send messages back,"
  echo "you need to add your number as a test recipient in Meta dashboard."
else
  echo "❌ Failed to send message:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  
  # Check for common errors
  if echo "$RESPONSE" | grep -q "131030"; then
    echo ""
    echo "📱 Error 131030: Recipient phone number not in allowed list"
    echo "Solution: Add your number to test recipients in Meta dashboard"
  elif echo "$RESPONSE" | grep -q "100"; then
    echo ""
    echo "🔑 Error 100: Authentication issue"
    echo "Solution: Check your access token"
  fi
fi