#!/bin/bash

# Script to add WhatsApp environment variables to Vercel
# Run this to configure your production environment

echo "🔧 Setting up WhatsApp environment variables in Vercel..."
echo ""
echo "This script will help you add the required WhatsApp variables to Vercel."
echo "You'll need to have the Vercel CLI installed and be logged in."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with: npm i -g vercel"
    exit 1
fi

echo "Adding WhatsApp environment variables..."
echo ""

# Add each environment variable
vercel env add WHATSAPP_ACCESS_TOKEN production
vercel env add WHATSAPP_PHONE_NUMBER_ID production  
vercel env add WHATSAPP_BUSINESS_ACCOUNT_ID production
vercel env add WHATSAPP_WEBHOOK_VERIFY_TOKEN production
vercel env add GRAPH_API_VERSION production

echo ""
echo "✅ Environment variables added!"
echo ""
echo "Now you need to:"
echo "1. Redeploy your application: vercel --prod"
echo "2. Run the database migration in Supabase"
echo "3. Configure the webhook in Meta dashboard"
echo ""
echo "Webhook Details:"
echo "URL: https://telitask.com/api/whatsapp/webhook-meta"
echo "Verify Token: telitask_verify_token_2024"