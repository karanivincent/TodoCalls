# TeliTask Product Requirements Document (PRD)

## Product Vision
TeliTask is the first ADHD-focused reminder service that uses phone calls to break through notification blindness, helping neurodivergent individuals reclaim their executive function and eliminate the "ADHD tax" of missed appointments and forgotten tasks.

## Problem Statement
- **67% of adults with ADHD** report missing important appointments monthly
- **Average ADHD tax**: $1,200/year from late fees, missed appointments, forgotten medications
- **Notification blindness**: Traditional app notifications are ignored within 2 weeks of installation
- **Executive dysfunction**: Starting tasks is the hardest part for ADHD brains

## Solution
A phone call reminder service that:
1. **Actually interrupts** - Phone calls demand immediate attention
2. **Works with ADHD brains** - No app to remember to check
3. **Provides body doubling** - Voice creates accountability moment
4. **Enables task initiation** - The call itself triggers action

## Target Audiences

### Primary: Adults with ADHD (25-45)
- Working professionals struggling with time blindness
- Parents managing family + personal schedules
- Students balancing coursework and life
- Recently diagnosed seeking tools

### Secondary: Caregivers
- Adult children supporting aging parents
- Parents of teens/young adults with ADHD
- Healthcare providers for patient compliance

### Tertiary: General Productivity
- Remote workers needing accountability
- Entrepreneurs managing multiple projects
- Anyone with notification fatigue

## Core Features

### MVP (Current)
- ✅ Phone call reminders at scheduled times
- ✅ Web dashboard for task management
- ✅ SMS fallback for missed calls
- ✅ Basic user authentication
- ✅ Contact form for support

### Phase 1: Essential ADHD Features (Q1 2025)
- [ ] Snooze options during calls (5, 15, 30 min)
- [ ] Recurring reminders (daily, weekly, custom)
- [ ] Multiple phone numbers per account
- [ ] Time zone handling
- [ ] Quick-add via SMS reply

### Phase 2: Enhanced Experience (Q2 2025)
- [ ] Custom voice messages (record your own)
- [ ] AI voice personalization (choose voice style)
- [ ] Wake-up calls with weather/calendar
- [ ] Accountability buddy matching
- [ ] IFTTT/Zapier integration

### Phase 3: Caregiver Features (Q3 2025)
- [ ] Family dashboard
- [ ] Medication adherence tracking
- [ ] Missed call alerts to caregivers
- [ ] Health system integration (Epic, Cerner)
- [ ] HIPAA compliance

### Phase 4: Advanced (Q4 2025)
- [ ] WhatsApp calling support
- [ ] International calling
- [ ] Smart home integration (Alexa, Google)
- [ ] Behavioral pattern insights
- [ ] Therapist collaboration tools

## Pricing Tiers

### Free Tier - "Test Drive"
- 5 calls/month
- 1 phone number
- Basic reminders only
- No SMS fallback
- **Goal**: Conversion to paid within 7 days

### Essential - $7/month
- 50 calls/month
- 2 phone numbers
- SMS fallback
- Snooze options
- **Target**: Medication reminders, students

### Pro - $15/month (DEFAULT)
- 150 calls/month
- 3 phone numbers
- Custom wake-up calls
- Recurring reminders
- API access
- Priority support
- **Target**: Working professionals

### Family - $29/month
- 400 calls/month
- 5 phone numbers
- Caregiver dashboard
- Custom voices
- WhatsApp integration
- **Target**: Families, caregivers

## Success Metrics

### User Metrics
- **Activation**: First reminder scheduled within 24h (target: 60%)
- **Retention**: Month 2 retention (target: 70%)
- **Daily Active**: Users with call today (target: 40%)
- **Task Completion**: Marked complete after call (target: 80%)

### Business Metrics
- **MRR Growth**: 20% month-over-month
- **CAC**: <$30 per paying customer
- **LTV:CAC Ratio**: >3:1
- **Churn**: <5% monthly

### Impact Metrics
- **Missed appointments reduced**: 75%
- **Medication adherence improved**: 85%
- **User-reported "ADHD tax" saved**: $100/month average

## Technical Requirements

### Infrastructure
- **Voice**: Twilio for calling, OpenAI for TTS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel edge functions
- **Email**: Resend for notifications

### Performance
- Call initiation: <2 seconds
- Dashboard load: <1 second  
- 99.9% uptime for calling service
- Support for 10,000 concurrent calls

### Security & Compliance
- SOC 2 Type I (Year 1)
- HIPAA compliance (Year 2)
- GDPR compliant
- End-to-end encryption for health data

## Go-to-Market Strategy

### Launch Channels
1. **ADHD Communities**: Reddit (r/ADHD), Facebook groups
2. **ProductHunt**: Target "Product of the Day"
3. **TikTok**: ADHD creators and advocates
4. **Therapist Partnerships**: Referral program

### Key Differentiators
- Only ADHD-focused phone reminder service
- No app required - works with any phone
- Voice creates accountability moment
- Designed by and for neurodivergent individuals

## Risk Mitigation

### Technical Risks
- **Twilio dependency**: Build backup provider (Vonage)
- **Spam blocking**: Maintain caller reputation, use local numbers
- **Cost overruns**: Call duration limits, usage caps

### Market Risks
- **Competition from big tech**: Focus on ADHD niche
- **Price sensitivity**: Emphasize value vs. ADHD tax
- **Adoption friction**: Streamline onboarding, social proof

## Development Philosophy
- **ADHD-first design**: Every feature considers executive dysfunction
- **Minimal cognitive load**: Simple, not simplistic
- **Reliable > Feature-rich**: Core function must be bulletproof
- **Accessibility built-in**: Screen readers, high contrast, keyboard nav