# Product Requirements Document (PRD) --- Call-Me Todo (Web App PWA)

## 1. Vision & Goals

**Vision:**\
A todo app that ensures you never miss important tasks by calling you on
your phone at the right time --- more reliable than push notifications
or emails.

**Goals:**\
- Provide simple, reliable voice-based reminders.\
- Start with individual users (professionals, families) → expand to SMEs
(clinics, delivery staff, field teams).\
- Achieve product-market fit in Kenya first, then scale globally.

------------------------------------------------------------------------

## 2. Target Users

-   **Primary users (initial focus):** Busy professionals and families
    who want reliable reminders.\
-   **Secondary users (growth):** SMEs with staff in the field (e.g.,
    pharmacies, delivery, clinics).\
-   **Market focus:** Kenya/local first (with Africa's Talking for
    calls/SMS). Expand later to global with Twilio.

------------------------------------------------------------------------

## 3. Core Features (MVP)

**Must-have (MVP):**\
- Task creation with time + phone number.\
- Voice call reminder at scheduled time.\
- Interactive call (Press 1 = complete, Press 2 = snooze 10 min).\
- Daily digest call (optional).\
- SMS fallback if call not answered.\
- Simple web dashboard (SvelteKit + Supabase).

**Nice-to-have (later):**\
- Team accounts (assign tasks to others).\
- WhatsApp integration.\
- Call recordings / AI-generated summaries.\
- Calendar sync (Google, Outlook).

------------------------------------------------------------------------

## 4. Voice Flow

-   **Interactive IVR:** Call reads task → "Press 1 to mark done / Press
    2 to snooze."\
-   If user doesn't pick up → SMS fallback with task details.

------------------------------------------------------------------------

## 5. Reminders

-   **Quiet hours:** Default 7 AM -- 9 PM, customizable by user.\
-   **Reminder modes:**
    -   Per-task calls.\
    -   Optional morning summary call with all tasks for the day.

------------------------------------------------------------------------

## 6. Monetization

-   **Free tier:** 30 calls/month.\
-   **Pro:** \$5/month for individuals, \$29/month for small teams.\
-   **Overages:** Additional calls billed per minute.

------------------------------------------------------------------------

## 7. Platforms

-   **Phase 1:** Web app (PWA) with mobile-friendly UI.\
-   **Phase 2:** Android app (using Capacitor/Tauri).\
-   **Phase 3:** iOS app (after validation).

------------------------------------------------------------------------

## 8. Metrics of Success

-   500+ tasks created within first 3 months.\
-   80% call pickup rate.\
-   \<10% missed call complaints.\
-   50+ paying users by end of first 6 months.

------------------------------------------------------------------------

## 9. Risks & Constraints

-   **Technical:**
    -   Must handle telephony API limits/reliability.\
    -   Ensure scalable scheduler (Supabase cron/Cloudflare Workers).\
-   **Regulatory:**
    -   Need explicit user opt-in for calls.\
    -   Respect DND and quiet hours (compliance in Kenya).\
-   **Business:**
    -   Must keep per-call costs low to maintain healthy margins.
