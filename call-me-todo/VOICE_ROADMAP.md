# TeliTask Voice System Roadmap

## 🎯 Current Status
**Date**: August 23, 2025  
**Issue**: Users hearing "application error" during voice calls  
**Architecture**: Currently using Vercel serverless + TwiML `<Say>` (incompatible with Twilio AI best practices)

## 🔍 Research Summary
After analyzing all 5 Twilio OpenAI Realtime API tutorials, discovered that **ALL tutorials use WebSocket + Media Streams architecture**, not simple TwiML responses. Our current serverless approach is fundamentally incompatible with modern Twilio AI voice integration.

---

## 📋 Phase 1: Enhanced Non-Conversational Reminders (Priority)

### 1.1 Fix Current Application Error ⚠️
- [ ] **Investigate Real Call Flow**: Test with actual task reminders vs test calls
- [ ] **Add Call-Specific Logging**: Track complete webhook → TwiML → audio chain
- [ ] **Verify TwiML Format**: Ensure XML structure matches Twilio specifications
- [ ] **Test Audio Serving**: Verify OpenAI TTS URLs are accessible from Twilio
- [ ] **Debug Webhook Headers**: Check Content-Type, CORS, and response codes
- [ ] **Validate Environment Variables**: Ensure all API keys are correctly configured

### 1.2 Upgrade to Natural OpenAI TTS 🎵
- [ ] **Replace `<Say>` with `<Play>`**: Use OpenAI TTS audio files instead of robotic voice
- [ ] **Implement Audio Generation Pipeline**:
  - Generate TTS using OpenAI API
  - Store audio files in temporary storage
  - Return public URLs in TwiML `<Play>` tags
- [ ] **Personalized Reminder Scripts**: Generate contextual reminders with task details
- [ ] **Audio Caching System**: Cache generated audio to reduce API costs
- [ ] **Error Fallbacks**: Graceful degradation to `<Say>` if TTS fails

### 1.3 Enhanced Reminder Features 🚀
- [ ] **Context-Aware Scripts**: "Hi Sarah! Time to work on your presentation due tomorrow"
- [ ] **Task Detail Integration**: Include priority, deadline, project context
- [ ] **Multiple Voice Options**: Different voices for different task types
- [ ] **Time-Sensitive Messaging**: Adjust urgency based on deadline proximity
- [ ] **Completion Confirmations**: "Great job finishing your presentation!"

---

## 📋 Phase 2: Conversational AI Mode (Premium Feature)

### 2.1 Infrastructure Setup 🏗️
- [ ] **Deploy Persistent Server**: Set up Node.js server on Railway/DigitalOcean
- [ ] **Implement WebSocket Architecture**: Following Tutorial 3 (Node.js Outbound Calling)
- [ ] **Media Streams Integration**: 
  - Configure `<Stream>` TwiML verb
  - Handle bidirectional audio streaming
  - Implement WebSocket proxy between Twilio ↔ OpenAI
- [ ] **Environment Configuration**: OpenAI Realtime API key, Twilio credentials
- [ ] **Connection Management**: Handle WebSocket lifecycle, reconnection logic

### 2.2 Voice Command System 🗣️
- [ ] **Basic Task Commands**:
  - "Postpone this task for 30 minutes"
  - "Mark this task as completed"
  - "Remind me again in 2 hours"
  - "Tell me more about this task"
- [ ] **Schedule Queries**:
  - "What's on my schedule today?"
  - "When is my next deadline?"
  - "What tasks are overdue?"
- [ ] **Smart Task Management**:
  - Voice-to-text for adding task notes
  - Reschedule tasks via natural language
  - Update task priorities through conversation
- [ ] **Natural Conversation Flow**: Handle interruptions, confirmations, clarifications

### 2.3 Premium Tier Implementation 💰
- [ ] **User Settings Toggle**: Basic TTS vs AI Conversation mode
- [ ] **Pricing Structure**: 
  - Basic: $5/month (OpenAI TTS only)
  - Premium: $25/month (Full AI conversation)
- [ ] **Usage Tracking**: Monitor API costs per user
- [ ] **Billing Integration**: Stripe/payment processing for premium features
- [ ] **Feature Gating**: Limit AI features to premium subscribers

---

## 🛠️ Technical Specifications

### Current Architecture (Phase 1)
```
User Phone → Twilio → Vercel Webhook → OpenAI Chat API → TTS Audio → TwiML <Play>
```

### Target Architecture (Phase 2)
```
User Phone → Twilio Media Streams → WebSocket Server → OpenAI Realtime API → Real-time Speech
```

### Key Technologies
- **Phase 1**: Vercel, OpenAI TTS API, Supabase
- **Phase 2**: Railway/DigitalOcean, OpenAI Realtime API, WebSockets, Media Streams

### Audio Formats
- **Current**: MP3/WAV via OpenAI TTS
- **Target**: Real-time `g711_ulaw` for Media Streams

---

## 💰 Cost Analysis

### Phase 1 Costs (Per Call)
- OpenAI TTS: ~$0.015 per call (1-2 sentences)
- Twilio Voice: $0.013 per minute
- **Total**: ~$0.03 per reminder call

### Phase 2 Costs (Per Call)
- OpenAI Realtime API: ~$0.24 per minute (input + output)
- Twilio Voice + Media Streams: $0.013 per minute
- Server Infrastructure: ~$20/month
- **Total**: ~$0.25 per minute of conversation

### Revenue Model
- **Basic Plan**: $5/month (covers ~167 reminder calls)
- **Premium Plan**: $25/month (covers ~100 minutes AI conversation)

---

## 🧪 Testing Plan

### Phase 1 Testing
1. **Fix Application Error**: Test real task reminders until no errors
2. **TTS Quality**: Verify natural voice generation works consistently
3. **Audio Delivery**: Ensure all generated audio files are accessible
4. **Error Handling**: Test failure scenarios (API down, invalid tasks, etc.)

### Phase 2 Testing
1. **WebSocket Stability**: Test connection persistence under load
2. **Voice Recognition**: Verify OpenAI accurately understands commands
3. **Task Actions**: Test all voice commands update database correctly
4. **Billing Integration**: Verify premium features are properly gated

---

## 📅 Timeline

### Week 1: Fix Current Issues
- Resolve "application error" completely
- Implement basic OpenAI TTS integration
- Test with real task reminders

### Week 2-3: Enhanced TTS System
- Personalized reminder generation
- Audio caching and optimization
- Multiple voice options

### Week 4-6: AI Conversation Mode
- WebSocket server deployment
- Media Streams integration
- Voice command implementation

### Week 7-8: Premium Features
- User settings and billing
- Feature gating and usage tracking
- Full production deployment

---

## 🔗 Reference Links
- [Node.js Outbound Tutorial](https://www.twilio.com/en-us/blog/outbound-calls-node-openai-realtime-api-voice)
- [Python AI Assistant](https://www.twilio.com/en-us/blog/voice-ai-assistant-openai-realtime-api-python)
- [TypeScript Minimalist](https://www.twilio.com/en-us/blog/minimalist-integration-twilio-openai-realtime)
- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [Twilio Media Streams Docs](https://www.twilio.com/docs/voice/media-streams)

---

## ✅ Progress Tracking

### Phase 1 Progress
- [x] Research Twilio tutorials and identify architecture mismatch
- [x] Analyze root cause of application error
- [ ] Fix webhook application error issue
- [ ] Implement OpenAI TTS integration
- [ ] Deploy and test enhanced reminders

### Phase 2 Progress  
- [ ] Set up WebSocket server infrastructure
- [ ] Implement Media Streams integration
- [ ] Build voice command system
- [ ] Create premium tier billing

---

*Last Updated: August 23, 2025*