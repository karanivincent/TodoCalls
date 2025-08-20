# TeliTask Dashboard Design Specification

## 🎨 Design Philosophy

### Core Principles
1. **Speed Over Features** - Creating a reminder should take <10 seconds
2. **Recognition Over Recall** - Users shouldn't need to remember how things work
3. **Forgiveness** - All actions are reversible, mistakes are easy to fix
4. **Progressive Disclosure** - Advanced features hidden until needed
5. **Accessibility First** - Designed for ADHD, anxiety, and cognitive differences

### Mental Model
Users think: "I need to remember X at Y time" 
Not: "I need to navigate to the task creation page and fill out a form"

The dashboard should feel like writing a sticky note, not filling out a form.

---

## 🏗️ Information Architecture

### Primary Navigation (Left Sidebar - Collapsible)
```
┌─────────────────┐
│ TeliTask 🔔     │  <- Logo/Brand
├─────────────────┤
│ 📞 Today (3)    │  <- Active reminders today
│ 📅 Upcoming (7) │  <- Future reminders  
│ ✓ Completed     │  <- Call history
│ ❌ Missed       │  <- Failed/missed calls
├─────────────────┤
│ 📱 My Phones    │  <- Manage numbers
│ ⚙️ Settings     │  <- Preferences
│ 💳 Billing      │  <- Subscription
├─────────────────┤
│ 🆘 Help         │  <- Support/FAQ
│ 👤 Profile      │  <- Account
└─────────────────┘
```

### Information Hierarchy
1. **Primary**: Quick Add Bar (always visible)
2. **Secondary**: Today's Reminders
3. **Tertiary**: Upcoming Reminders
4. **Quaternary**: Historical Data

---

## 🎯 Core User Flows

### Flow 1: Quick Add (Primary Action)
```
User Types → AI Parses → Confirms → Scheduled
"Call me at 3pm about team meeting"
```

**Design Requirements:**
- Persistent top bar across all pages
- Natural language processing
- Instant visual feedback
- One-click confirmation

### Flow 2: Browse & Manage
```
View Today → See Card → Quick Actions → Done
```

**Card Actions:**
- Reschedule (drag & drop)
- Edit message
- Cancel
- Duplicate
- Test call now

### Flow 3: Missed Call Recovery
```
See Alert → Review Missed → Reschedule → Confirmed
```

**Recovery UX:**
- Red badge on sidebar
- Top banner alert
- One-click reschedule
- Suggested times

---

## 📐 Dashboard Layout

### Desktop Layout (1440px)
```
┌──────────────────────────────────────────────────────────────┐
│ QUICK ADD BAR                                          [+ Add]│ <- Sticky top
├────────┬──────────────────────────────────────────────────────┤
│        │                                                      │
│  NAV   │  MAIN CONTENT AREA                                  │
│ (240px)│                                                      │
│        │  ┌─────────────────────────────────────────────┐    │
│        │  │ TODAY - Thursday, Dec 20                    │    │
│        │  ├─────────────────────────────────────────────┤    │
│        │  │ [Reminder Cards Timeline View]              │    │
│        │  └─────────────────────────────────────────────┘    │
│        │                                                      │
│        │  ┌─────────────────────────────────────────────┐    │
│        │  │ UPCOMING                                    │    │
│        │  ├─────────────────────────────────────────────┤    │
│        │  │ [Calendar Grid or List View]                │    │
│        │  └─────────────────────────────────────────────┘    │
│        │                                           STATS →    │
└────────┴──────────────────────────────────────────────────────┘
```

### Mobile Layout (375px)
```
┌─────────────────┐
│ ☰  TeliTask  +  │ <- Hamburger, Logo, Add
├─────────────────┤
│ QUICK ADD BAR   │ <- Tap to expand
├─────────────────┤
│ TODAY (3)       │
├─────────────────┤
│ [Reminder Card] │ <- Swipe actions
│ [Reminder Card] │
│ [Reminder Card] │
├─────────────────┤
│ UPCOMING        │
├─────────────────┤
│ [List View]     │
└─────────────────┘
Bottom Tab Bar:
[Today] [Calendar] [Add] [History] [Settings]
```

---

## 🧩 Component Design

### 1. Quick Add Bar (Most Important Component)
```
┌──────────────────────────────────────────────────────────┐
│ 🎤 "Remind me to [take medication] at [2:30 PM] today"  │
│    └─ Predictive text/voice input with inline editing    │
└──────────────────────────────────────────────────────────┘
```

**Features:**
- Natural language processing with visual parsing
- Voice input button
- Inline time/date picker on click
- Smart suggestions based on history
- Keyboard shortcuts (Cmd+K to focus)

### 2. Reminder Card
```
┌─────────────────────────────────────────────┐
│ ┌───┐                                       │
│ │2:30│  Team Standup Meeting        [⋮]    │
│ │ PM │  "Discuss Q4 roadmap"                │
│ └───┘  📱 +1 (555) 123-4567                │
│        [Reschedule] [Test Now] [Cancel]     │
└─────────────────────────────────────────────┘
```

**States:**
- Pending (blue border)
- Calling (animated green)
- Completed (green check)
- Missed (red alert)
- Snoozed (yellow clock)

### 3. Timeline View (Today)
```
8 AM  ─────────────────────────────────
      │ ▢ Morning medication
9 AM  ─────────────────────────────────
      │ ✓ Team standup (Completed)
10 AM ─────────────────────────────────
      │ 
11 AM ─────────────────────────────────
      │ ▢ Client call prep
12 PM ─────────────────────────────────
      │ NOW ← (Live indicator)
1 PM  ─────────────────────────────────
      │ ▢ Lunch break reminder
```

### 4. Calendar Grid (Upcoming)
```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │  3  │  2  │  5  │  4  │  1  │     │
│     │ ••  │ •   │ •••••│ ••• │ •   │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
         ↑ Dots indicate number of reminders
```

### 5. Empty States
```
┌─────────────────────────────────────────┐
│                                         │
│         📞                              │
│                                         │
│    No reminders scheduled for today     │
│                                         │
│  [Create Your First Reminder]           │
│                                         │
│  Or try: "Call me at 3pm about lunch"   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎨 Visual Design System

### Color Palette
```
Primary Actions:
- Orange: #F97316 (CTAs, Add buttons)
- Orange Hover: #EA580C

Status Colors:
- Success Green: #10B981
- Warning Yellow: #F59E0B  
- Error Red: #EF4444
- Info Blue: #3B82F6

Neutral:
- Background: #FAFAFA
- Cards: #FFFFFF
- Borders: #E5E7EB
- Text Primary: #111827
- Text Secondary: #6B7280
```

### Typography
```
Headings: Inter/System Font
- H1: 32px, Bold (Page titles)
- H2: 24px, Semibold (Section headers)
- H3: 18px, Semibold (Card titles)

Body: Inter/System Font  
- Large: 16px (Primary content)
- Regular: 14px (Secondary content)
- Small: 12px (Metadata, timestamps)

Monospace: 'SF Mono', Monaco
- Timer displays
- Phone numbers
```

### Spacing System
```
Base unit: 4px
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
```

### Elevation/Shadows
```
Level 0: No shadow (inline elements)
Level 1: 0 1px 3px rgba(0,0,0,0.12) (cards)
Level 2: 0 4px 6px rgba(0,0,0,0.15) (dropdowns)
Level 3: 0 10px 20px rgba(0,0,0,0.20) (modals)
```

---

## 🔄 Interaction Patterns

### Micro-interactions
1. **Add Button**: Scales up on hover, ripple effect on click
2. **Card Hover**: Subtle elevation change, action buttons fade in
3. **Drag & Drop**: Card lifts, slots highlight, smooth snap
4. **Success State**: Green checkmark animation with haptic feedback
5. **Loading**: Skeleton screens, not spinners (better for ADHD)

### Gesture Support (Mobile)
- **Swipe Right**: Mark complete
- **Swipe Left**: Reveal quick actions
- **Long Press**: Multi-select mode
- **Pull to Refresh**: Sync latest
- **Pinch**: Zoom timeline view

### Keyboard Shortcuts
```
Cmd/Ctrl + K: Focus quick add
Cmd/Ctrl + N: New reminder
Cmd/Ctrl + F: Search reminders
Space: Play/pause in detail view
Esc: Close modals
Tab: Navigate between cards
Enter: Edit selected
```

---

## ♿ Accessibility Features

### ADHD-Specific Design
1. **Minimal Distractions**: Clean, uncluttered interface
2. **Visual Timers**: See time until next reminder
3. **Color Coding**: Quick status recognition
4. **Large Touch Targets**: 44x44px minimum
5. **Quiet Mode**: Reduce animations option

### Screen Reader Support
- Semantic HTML structure
- ARIA labels on all interactions
- Keyboard navigation for everything
- Focus indicators (not just color)
- Skip links for navigation

### Cognitive Accessibility
- Simple language (8th grade level)
- Icons with text labels
- Consistent patterns
- Undo for all actions
- Clear error messages with solutions

---

## 📊 Dashboard Analytics Widget

### Quick Stats (Top Right Corner)
```
┌─────────────────────────────┐
│ This Week                   │
│ ━━━━━━━━━━━━━━━━━          │
│ 23/30 Completed  77%        │
│                             │
│ Streaks: 🔥 5 days          │
│ Best time: 9-10 AM          │
│ Most missed: Medications    │
└─────────────────────────────┘
```

### Insights (Optional Expansion)
- Peak productivity hours
- Most successful reminder types
- Improvement trends
- Snooze patterns

---

## 📱 Mobile-Specific Features

### Quick Actions Widget (iOS/Android)
- Add reminder without opening app
- See next 3 reminders
- Mark complete from widget

### Notification Actions
- Snooze from notification
- Mark complete
- Reschedule with preset options

### App Shortcuts (3D Touch/Long Press)
1. Add medication reminder
2. Add meeting reminder  
3. View today
4. Test call

---

## 🚀 Advanced Features (Progressive Disclosure)

### Power User Tools (Hidden by Default)
1. **Bulk Actions**: Select multiple, edit together
2. **Templates**: Save common reminders
3. **Recurring Patterns**: Complex schedules
4. **Integrations**: Calendar sync, Zapier
5. **API Access**: Programmatic creation

### AI Enhancements
- Smart time suggestions based on history
- Conflict detection with calendar
- Natural language like "every weekday"
- Voice command improvements
- Predictive reminder suggestions

---

## 🎭 Personality & Voice

### UI Copy Guidelines
- **Friendly but not cutesy**: "Got it!" not "Awesome sauce!"
- **Clear over clever**: "Reminder set" not "Time travel scheduled"
- **Encouraging**: "Great job! 5-day streak" 
- **Forgiving**: "No worries, let's reschedule" not "You missed this"

### Empty State Messages
- Today: "Your day is clear! Take a breath 🌟"
- Upcoming: "Nothing scheduled yet. Plan something great!"
- Completed: "You're crushing it! All done today."
- Missed: "It happens! Let's reschedule these."

---

## 🔮 Future Vision

### Phase 2 Features
1. **Team Reminders**: Shared accountability
2. **Location-Based**: "When I arrive at..."
3. **Smart Home**: Alexa/Google integration
4. **Wearables**: Apple Watch complications
5. **Analytics Dashboard**: Detailed insights

### Phase 3 Innovation
1. **AI Assistant**: Proactive suggestions
2. **Health Integration**: Medication adherence tracking
3. **Mood Tracking**: Correlation with completed tasks
4. **Social Features**: Accountability partners
5. **Gamification**: Achievements, leaderboards

---

## 📏 Success Metrics

### Usability KPIs
- Time to create first reminder: <10 seconds
- Task completion rate: >80%
- User error rate: <5%
- Support tickets: <2% of MAU
- Mobile usage: >60%

### Engagement Metrics
- Daily active usage: >70%
- Reminders per user: 3-5 daily
- Completion rate: >75%
- Snooze rate: <20%
- Churn: <5% monthly

---

## 🎯 Design Decisions Rationale

### Why Timeline View?
- Matches mental model of time
- Reduces cognitive load
- Visual progress indicator
- Natural scrolling pattern

### Why Natural Language Input?
- Fastest input method
- No form fields to navigate
- Matches how people think
- Reduces friction

### Why Cards Over Lists?
- Better for touch interfaces
- More information density
- Clearer visual hierarchy
- Easier scanning

### Why Left Sidebar Navigation?
- Industry standard pattern
- Muscle memory from other apps
- Persistent wayfinding
- Collapsible for focus

---

## 🚦 Implementation Priorities

### MVP (Launch)
1. Quick Add Bar with NLP
2. Today view with cards
3. Basic calendar view
4. Phone management
5. Settings

### Version 1.1
1. Drag and drop
2. Keyboard shortcuts
3. Mobile apps
4. Widgets
5. Templates

### Version 2.0
1. Team features
2. Advanced analytics
3. AI suggestions
4. Integrations
5. API

---

*This dashboard design prioritizes speed, clarity, and reliability—the three things users need most from a reminder system that actually works.*