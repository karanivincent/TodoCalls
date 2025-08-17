# Call-Me Todo MVP Tasks (7-Day Sprint)

## 📋 Project Overview
Building a minimal viable product that allows users to create tasks and receive phone call reminders.

**Core Features:**
- User authentication (email magic link)
- Create tasks with phone number and scheduled time
- Automated phone calls at scheduled time
- Interactive voice response (complete/snooze)

---

## 🎯 Day 1-2: Foundation Setup

### Project Initialization
- [ ] Initialize SvelteKit project with TypeScript
- [ ] Configure Tailwind CSS for styling
- [ ] Set up ESLint and Prettier
- [ ] Create project structure (routes, lib, components)

### Supabase Setup
- [ ] Create Supabase project
- [ ] Configure authentication (magic link email)
- [ ] Set up environment variables (.env.local)
- [ ] Initialize Supabase client in SvelteKit

### Database Schema
- [ ] Create users table (handled by Supabase Auth)
- [ ] Create tasks table:
  ```sql
  - id (uuid, primary key)
  - user_id (uuid, foreign key to auth.users)
  - title (text, required)
  - phone_number (text, required)
  - scheduled_at (timestamp with timezone)
  - status (enum: pending, completed, snoozed, failed)
  - completed_at (timestamp with timezone, nullable)
  - created_at (timestamp with timezone)
  - updated_at (timestamp with timezone)
  ```
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create indexes for scheduled_at and status

### Basic Auth Flow
- [ ] Create login page with email input
- [ ] Implement magic link authentication
- [ ] Create protected route middleware
- [ ] Add logout functionality
- [ ] Handle auth state in layout

---

## 🛠️ Day 3-4: Task Management

### Task Creation
- [ ] Design task creation form UI
- [ ] Add form validation:
  - Phone number format (international format)
  - Future date/time only
  - Required fields
- [ ] Create API endpoint for task creation
- [ ] Implement task creation in Supabase
- [ ] Add success/error notifications

### Task List View
- [ ] Create dashboard layout
- [ ] Build task list component
- [ ] Show upcoming tasks sorted by scheduled_at
- [ ] Add task status indicators
- [ ] Implement real-time updates with Supabase subscriptions

### Task Actions
- [ ] Add manual complete button
- [ ] Implement delete functionality
- [ ] Add edit capability (stretch goal)
- [ ] Create confirmation dialogs
- [ ] Update task status in database

---

## 📞 Day 5-6: Voice Integration

### Telephony Provider Setup
- [ ] Evaluate Africa's Talking vs Twilio (quick decision)
- [ ] Create account and get API credentials
- [ ] Install SDK/client library
- [ ] Configure webhook URLs
- [ ] Set up development phone number

### Call Triggering System
- [ ] Create API endpoint for initiating calls
- [ ] Build call payload with task details
- [ ] Implement call initiation logic
- [ ] Add error handling and retries
- [ ] Log call attempts in database

### IVR Implementation
- [ ] Create TwiML/Voice XML for call flow
- [ ] Design voice script:
  ```
  "Hello, this is your task reminder. 
  Your task is: [TASK_TITLE]. 
  Press 1 to mark as complete. 
  Press 2 to snooze for 10 minutes."
  ```
- [ ] Handle DTMF input (1 or 2)
- [ ] Create webhook for call status updates
- [ ] Update task status based on user input

### Task Scheduling
- [ ] Set up Supabase Edge Function for cron job
- [ ] Create function to check for due tasks (every minute)
- [ ] Implement logic to trigger calls for due tasks
- [ ] Handle timezone considerations
- [ ] Prevent duplicate calls

---

## 🚀 Day 7: Testing & Deployment

### End-to-End Testing
- [ ] Test complete user flow:
  1. Sign up with email
  2. Create task with phone number
  3. Receive call at scheduled time
  4. Complete/snooze via phone
  5. Verify status update
- [ ] Test with 5 different phone numbers
- [ ] Test edge cases (invalid numbers, past times)
- [ ] Fix critical bugs only

### Deployment
- [ ] Set up Vercel project
- [ ] Configure environment variables
- [ ] Deploy SvelteKit app
- [ ] Set up custom domain (if available)
- [ ] Configure production database

### Landing Page
- [ ] Create simple hero section
- [ ] Add "How it works" in 3 steps
- [ ] Include signup CTA
- [ ] Add basic footer with contact
- [ ] Ensure mobile responsiveness

---

## 📊 Success Metrics

### Must Have (for MVP completion)
- ✅ User can sign up and log in
- ✅ User can create a task with phone and time
- ✅ System calls at the scheduled time
- ✅ Call plays task reminder message
- ✅ User can press 1 or 2 to complete/snooze
- ✅ Task status updates accordingly
- ✅ Works for at least 5 test users

### Nice to Have (if time permits)
- ⏰ Edit existing tasks
- ⏰ Cancel scheduled calls
- ⏰ Call history/logs visible to user
- ⏰ Better error messages
- ⏰ Loading states

---

## 🔧 Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| Frontend | SvelteKit | Full-stack framework, fast development |
| Styling | Tailwind CSS | Rapid UI development |
| Database | Supabase | Auth + DB + Realtime in one |
| Telephony | Twilio/Africa's Talking | Reliable voice calls |
| Hosting | Vercel | Easy SvelteKit deployment |
| Scheduler | Supabase Edge Functions | Built-in cron support |

---

## 🚨 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Telephony API complexity | Start with simplest implementation, read docs thoroughly |
| Scheduling reliability | Use robust cron, add monitoring |
| Phone number validation | Use library like libphonenumber |
| Time zone issues | Store everything in UTC, convert on display |
| Call costs | Set daily limits during testing |

---

## 📝 Daily Standup Notes

### Day 1
- [ ] Morning: Project setup, Supabase configuration
- [ ] Afternoon: Database schema, auth implementation
- [ ] Blockers: 
- [ ] Tomorrow: Start task CRUD

### Day 2
- [ ] Morning: Complete auth flow
- [ ] Afternoon: Start task creation form
- [ ] Blockers:
- [ ] Tomorrow: Finish task management

### Day 3
- [ ] Morning: Task creation and validation
- [ ] Afternoon: Task list view
- [ ] Blockers:
- [ ] Tomorrow: Task actions

### Day 4
- [ ] Morning: Complete/delete functionality
- [ ] Afternoon: UI polish, error handling
- [ ] Blockers:
- [ ] Tomorrow: Voice integration

### Day 5
- [ ] Morning: Set up telephony provider
- [ ] Afternoon: Call triggering system
- [ ] Blockers:
- [ ] Tomorrow: IVR and scheduling

### Day 6
- [ ] Morning: IVR implementation
- [ ] Afternoon: Cron job setup
- [ ] Blockers:
- [ ] Tomorrow: Testing and deployment

### Day 7
- [ ] Morning: End-to-end testing
- [ ] Afternoon: Deploy and create landing page
- [ ] Blockers:
- [ ] Complete: MVP ready for users!

---

## 🎉 Definition of Done

The MVP is complete when:
1. A new user can sign up with email
2. They can create a task with their phone number
3. The system reliably calls them at the scheduled time
4. They can interact with the call to complete/snooze
5. The app is deployed and accessible via web browser
6. At least 5 test calls have been successfully completed

---

*Last Updated: [Current Date]*
*Sprint Duration: 7 Days*
*Estimated Hours: 56 hours (8 hours/day)*