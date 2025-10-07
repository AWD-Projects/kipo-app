# 🚀 Kipo PWA Implementation Plan

## 📋 Executive Summary

Transform Kipo into a **Progressive Web App (PWA)** with native-like capabilities including push notifications, offline support, and installable experience. This approach provides 80% of native app benefits with 20% of the development effort.

**Timeline**: 2-3 weeks
**Status**: Ready to implement
**Prerequisites**: Database schema complete ✅

---

## 🎯 Strategic Decision

Based on `pwa.md` analysis, we're pursuing:

**✅ Path Chosen**: PWA + Push Notifications
- Leverage existing Next.js web app
- Add Progressive Web App capabilities
- Implement push notifications (Firebase Cloud Messaging)
- Use Supabase pg_cron for scheduling
- Keep all business logic server-side

**🔄 Future Phase**: Thin React Native layer
- Only for features requiring native APIs
- Widgets, background sync, App Intents
- Minimal duplication of business logic

---

## 📊 Implementation Milestones

### Milestone 1: PWA Shell (3-4 days)
**Objective**: Make app installable on all platforms

**Deliverables**:
- ✅ Web manifest configured
- ✅ Service Worker registered
- ✅ Offline baseline (skeleton screens)
- ✅ Installable on iOS/Android/desktop
- ✅ Lighthouse PWA score: 100

**Files to Create**:
```
public/
  ├── manifest.json
  ├── service-worker.js
  ├── icons/
  │   ├── icon-72x72.png
  │   ├── icon-96x96.png
  │   ├── icon-128x128.png
  │   ├── icon-144x144.png
  │   ├── icon-152x152.png
  │   ├── icon-192x192.png
  │   ├── icon-384x384.png
  │   ├── icon-512x512.png
  │   └── apple-touch-icon.png
  └── offline.html
```

**Code Changes**:
```
src/app/layout.tsx         # Add manifest link, theme-color meta
src/lib/pwa/
  ├── register-sw.ts       # Service worker registration
  ├── offline-manager.ts   # Offline state management
  └── install-prompt.ts    # Install banner logic
```

---

### Milestone 2: Push Opt-In & Storage (3-4 days)
**Objective**: Enable users to subscribe to push notifications

**Deliverables**:
- ✅ Permission request flow
- ✅ Push subscription capture (Web Push API)
- ✅ Subscription persistence to database
- ✅ Settings UI for notification preferences
- ✅ Channel toggles (push/email)
- ✅ Quiet hours configuration

**Database Schema**: ✅ Already created in `migrations/001_notifications_and_push_schema.sql`

**Files to Create**:
```
src/lib/push/
  ├── subscription.ts      # Web Push API wrapper
  ├── permission.ts        # Permission request logic
  └── firebase-messaging.ts # Firebase Cloud Messaging integration

src/app/dashboard/settings/notifications/
  ├── page.tsx             # Notification preferences UI
  └── _components/
      ├── PushToggle.tsx
      ├── QuietHoursSelector.tsx
      └── ChannelPreferences.tsx

src/app/api/push/
  ├── subscribe/route.ts   # Save subscription
  └── unsubscribe/route.ts # Remove subscription
```

**User Flow**:
```
User opens app → Banner: "Enable notifications?" →
Click "Enable" → Browser permission prompt →
Grant permission → Subscribe to push →
Save subscription to DB → Show success message
```

---

### Milestone 3: Server Scheduling & Dispatch (4-5 days)
**Objective**: Build notification delivery infrastructure

**Deliverables**:
- ✅ pg_cron schedules defined
- ✅ Edge Function: `dispatch-notifications`
- ✅ Firebase Cloud Messaging integration validated
- ✅ Multi-channel delivery (push + email)
- ✅ Status tracking and retries
- ✅ Error handling and logging

**Database Cron Jobs**: ✅ Already created in `migrations/002_cron_scheduler.sql`

**Files to Create**:
```
supabase/functions/dispatch-notifications/
  ├── index.ts             # Main Edge Function entry
  ├── scheduler.ts         # Job scheduling logic
  ├── dispatcher.ts        # Multi-channel dispatcher
  ├── providers/
  │   ├── push.ts          # Push notification sender
  │   ├── email.ts         # Email sender (SendGrid)
  │   └── whatsapp.ts      # WhatsApp (future)
  ├── utils/
  │   ├── timezone.ts      # Timezone conversions
  │   ├── quiet-hours.ts   # Quiet hours checker
  │   └── retry.ts         # Retry logic
  └── types.ts             # TypeScript types
```

**Cron Schedule**:
```
Main Dispatcher:    Every 5 minutes    (near real-time)
Retry Handler:      Every 30 minutes   (failed notifications)
Daily Cleanup:      3:00 AM UTC        (old data cleanup)
```

**Dispatcher Logic Flow**:
```
pg_cron triggers Edge Function →
Fetch pending notifications (scheduled_for <= NOW) →
Group by user →
For each user:
  1. Check notification preferences
  2. Respect quiet hours (defer if needed)
  3. Get active push subscriptions
  4. Send via Firebase Cloud Messaging (push)
  5. Send via SendGrid (email)
  6. Log results to notification_logs
  7. Update notification_jobs status
→ Return summary (sent/failed/deferred)
```

---

### Milestone 4: Card Due Reminder v1 (2-3 days)
**Objective**: Implement first use case - payment reminders

**Deliverables**:
- ✅ Reminder rules (N days before due)
- ✅ Timezone-normalized scheduling
- ✅ Quiet hours compliance
- ✅ Deep links from notification to card
- ✅ Rich notification content
- ✅ End-to-end tests

**Already Implemented**:
- ✅ Database trigger: `schedule_card_payment_reminders()`
- ✅ Auto-scheduling on card create/update
- ✅ Payload generation with card details

**Files to Create**:
```
src/lib/notifications/
  ├── card-reminders.ts    # Card reminder business logic
  ├── deep-links.ts        # Deep link generator
  └── templates.ts         # Notification templates

supabase/functions/dispatch-notifications/
  └── templates/
      └── card-due.ts      # Card due notification template
```

**Notification Content**:
```json
{
  "title": "💳 Pago de Tarjeta BBVA",
  "body": "Vence mañana: $1,250.00",
  "icon": "/icons/icon-192x192.png",
  "badge": "/icons/badge-72x72.png",
  "data": {
    "type": "card_due",
    "card_id": "uuid",
    "url": "/dashboard/cards?card=uuid"
  },
  "actions": [
    {
      "action": "view",
      "title": "Ver Tarjeta"
    },
    {
      "action": "dismiss",
      "title": "Cerrar"
    }
  ]
}
```

**Deep Link Handling**:
```
User clicks notification →
Service Worker catches event →
Open /dashboard/cards?card=<id> →
App highlights the card →
Show payment details
```

---

### Milestone 5: iOS Shortcuts Pack (1-2 days)
**Objective**: Enhance iOS Shortcuts integration

**Status**: ✅ API already implemented
**Enhancement**: Better documentation and downloadable shortcuts

**Files to Update**:
```
src/app/docs/shortcuts/page.tsx    # Enhanced guide
public/shortcuts/
  ├── add-transaction.shortcut      # Downloadable
  ├── mark-payment.shortcut         # Downloadable
  └── quick-balance.shortcut        # Downloadable (new)
```

**Deliverables**:
- ✅ Downloadable .shortcut files
- ✅ Step-by-step install guide
- ✅ Video tutorials (optional)
- ✅ Troubleshooting section
- ✅ Safety and security notes

---

### Milestone 6: Analytics & Quality (2-3 days)
**Objective**: Monitor and optimize notification system

**Deliverables**:
- ✅ Delivery metrics dashboard
- ✅ Opt-in rate tracking
- ✅ Error dashboards
- ✅ Regression test checklist
- ✅ Performance monitoring

**Files to Create**:
```
src/app/dashboard/analytics/
  ├── page.tsx                      # Analytics dashboard
  └── _components/
      ├── DeliveryStats.tsx         # Delivery metrics
      ├── OptInFunnel.tsx           # Opt-in conversion
      ├── ChannelPerformance.tsx    # By channel
      └── ErrorReport.tsx           # Error tracking

src/lib/analytics/
  ├── notification-metrics.ts       # Metrics queries
  └── charts.ts                     # Chart configurations
```

**Key Metrics**:
- **Delivery Rate**: % of notifications successfully delivered
- **Opt-in Rate**: % of users who enable push notifications
- **Click-Through Rate**: % of notifications clicked
- **Channel Performance**: Success rate by channel (push vs email)
- **Error Rate**: % of failed deliveries
- **Time to Delivery**: Average latency

**Database Views**: ✅ Already created
- `notification_delivery_stats`: Daily stats by channel
- `cron_job_health`: Cron execution health

---

## 🏗️ Technical Architecture

### Frontend Stack
```
Next.js 15 (App Router)
├── PWA Manifest
├── Service Worker (Workbox)
├── Web Push API
├── IndexedDB (offline storage)
└── Push Notification UI
```

### Backend Stack
```
Supabase
├── PostgreSQL (RLS enabled)
│   ├── notification_preferences
│   ├── push_subscriptions
│   ├── notification_jobs
│   └── notification_logs
├── pg_cron (scheduler)
└── Edge Functions (Deno)
    └── dispatch-notifications
```

### External Services
```
Firebase Cloud Messaging (FCM)
├── Web Push delivery
└── Rich notifications

SendGrid
├── Email delivery
└── Template rendering
```

---

## 🔐 Security & Privacy

### Data Protection
- ✅ Row Level Security on all tables
- ✅ Push subscription encryption (p256dh + auth keys)
- ✅ Service role isolation (Edge Functions only)
- ✅ No sensitive data in notification payload
- ✅ CRON_SECRET for webhook authentication

### User Privacy
- ✅ Explicit opt-in required
- ✅ Granular channel controls
- ✅ Easy unsubscribe
- ✅ Minimal device metadata stored
- ✅ Quiet hours respected
- ✅ GDPR compliance (data export/delete)

### Security Checklist
- [ ] Validate all user inputs
- [ ] Rate limit API endpoints
- [ ] Sanitize notification content
- [ ] Audit log all deliveries
- [ ] Rotate secrets regularly
- [ ] Monitor for abuse patterns
- [ ] Implement CSP headers
- [ ] HTTPS everywhere

---

## 📱 User Experience

### Installation Flow
```
Visit app → See "Install App" banner →
Click "Install" → Browser install prompt →
App icon added to home screen →
Open app (standalone mode) →
Full-screen experience
```

### Notification Opt-In
```
First visit → Contextual banner:
  "Get notified before payments are due"
  [Enable Notifications] [Maybe Later]
→ Click "Enable" → Browser permission →
→ Subscribe success → Show in Settings
```

### Notification Types
1. **Card Due Reminder**: N days before payment due
2. **Payment Overdue**: If payment missed
3. **Large Transaction**: Optional alert for large expenses
4. **Weekly Digest**: Summary of spending (optional)
5. **Budget Alert**: When approaching budget limit (future)

### Notification Content Best Practices
- ✅ **Title**: 40 chars max, action-oriented
- ✅ **Body**: 120 chars max, include key info
- ✅ **Actions**: Max 2, clear labels
- ✅ **Icon**: 192x192 app icon
- ✅ **Badge**: 72x72 monochrome icon
- ✅ **Deep link**: Specific destination
- ✅ **Collapse key**: Prevent spam

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
describe('Push Subscription', () => {
  it('should request permission', async () => {
    // Mock Notification API
    // Test permission flow
  })

  it('should save subscription to database', async () => {
    // Test API endpoint
  })
})

describe('Quiet Hours', () => {
  it('should defer notifications during quiet hours', () => {
    // Test is_in_quiet_hours() function
  })
})
```

### Integration Tests
```typescript
describe('Notification Dispatch', () => {
  it('should send push and email for card due reminder', async () => {
    // Create test card with due date
    // Trigger notification job
    // Verify delivery via both channels
  })

  it('should retry failed notifications', async () => {
    // Mock provider failure
    // Verify retry logic
  })
})
```

### End-to-End Tests
```typescript
describe('Card Payment Reminder Flow', () => {
  it('should notify user of upcoming payment', async () => {
    // Create user
    // Enable notifications
    // Create card with due date tomorrow
    // Wait for notification job creation
    // Manually trigger dispatch
    // Verify notification received
  })
})
```

### Manual Testing Checklist
- [ ] PWA installable on iOS Safari
- [ ] PWA installable on Android Chrome
- [ ] PWA installable on desktop Chrome
- [ ] Push notification permission request works
- [ ] Push notification received on all platforms
- [ ] Deep link opens correct screen
- [ ] Offline mode shows skeleton
- [ ] Settings page allows unsubscribe
- [ ] Quiet hours respected
- [ ] Email fallback works when push fails

---

## 🚀 Deployment Guide

### Step 1: Database Migration
```bash
# Connect to Supabase SQL Editor
# Or use psql

# Run migrations in order:
1. migrations/001_notifications_and_push_schema.sql
2. migrations/002_cron_scheduler.sql

# Verify tables created:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%notification%';
```

### Step 2: Configure Secrets
```bash
# Generate CRON_SECRET
openssl rand -base64 32

# Set Supabase secrets
supabase secrets set CRON_SECRET=<your-secret>
supabase secrets set ONESIGNAL_APP_ID=<your-app-id>
supabase secrets set ONESIGNAL_API_KEY=<your-api-key>
supabase secrets set SENDGRID_API_KEY=SG.xxxxx
supabase secrets set SENDGRID_TEMPLATE_ID=d-xxxxx
supabase secrets set SENDGRID_FROM_EMAIL=notifications@kipo.app
supabase secrets set APP_URL=https://kipo.app

# Verify secrets
supabase secrets list
```

### Step 3: Update Cron Jobs
```sql
-- Replace YOUR_CRON_SECRET_HERE in migrations/002_cron_scheduler.sql
-- Then re-run the migration

-- Or update directly:
UPDATE cron.job
SET command = replace(
  command,
  'YOUR_CRON_SECRET_HERE',
  '<your-actual-secret>'
)
WHERE jobname LIKE 'dispatch-notifications%';
```

### Step 4: Deploy Edge Function
```bash
# Deploy dispatch-notifications Edge Function
supabase functions deploy dispatch-notifications

# Test manually
supabase functions invoke dispatch-notifications \
  --headers '{"Authorization":"Bearer <CRON_SECRET>"}' \
  --body '{"mode":"scheduled","batch_size":10}'
```

### Step 5: Configure Firebase Cloud Messaging
```bash
# 1. Follow FIREBASE_FCM_SETUP.md guide
# 2. Create Firebase project
# 3. Generate VAPID keys
# 4. Get Server Key
# 5. Set secrets (already done in Step 2)
# 6. Test with Firebase Console
```

### Step 6: Build and Deploy Frontend
```bash
# Update manifest.json with production URLs
# Update service-worker.js with correct paths

# Build
npm run build

# Deploy to Vercel
vercel --prod

# Or use Vercel GitHub integration (auto-deploy)
```

### Step 7: Verify Deployment
```bash
# Check PWA installation
# Open https://kipo.app in Chrome
# Click "Install" banner
# Verify app opens in standalone mode

# Check push notifications
# Navigate to Settings > Notifications
# Click "Enable Notifications"
# Grant permission
# Verify subscription saved to database

# Check cron jobs
# Wait 5 minutes for first cron execution
# Query: SELECT * FROM cron_execution_history LIMIT 10;
```

---

## 📊 Success Metrics

### Phase 1 Goals (First Month)
- ✅ 60%+ of mobile users install PWA
- ✅ 50%+ of users enable push notifications
- ✅ 85%+ successful delivery rate
- ✅ < 5% failure rate after retries
- ✅ < 10 second average delivery latency
- ✅ No regression in core features

### Phase 2 Goals (3 Months)
- ✅ 70%+ push notification opt-in rate
- ✅ 30%+ click-through rate on reminders
- ✅ Measurable reduction in late payments
- ✅ < 1% user complaints about notification frequency
- ✅ 95%+ uptime for notification system

### Business Impact
- **Reduce late payments**: Track card payment history before/after
- **Increase engagement**: Daily active users (DAU) increase
- **Improve retention**: Week-over-week retention rate
- **User satisfaction**: NPS score improvement

---

## ⚠️ Risks & Mitigations

### Risk 1: iOS PWA Push Limitations
**Problem**: iOS 16.4+ supports Web Push, but with limitations
**Mitigation**:
- Test thoroughly on iOS 17+
- Provide email fallback
- Consider optional digest mode
- Document limitations for users

### Risk 2: Notification Fatigue
**Problem**: Too many notifications annoy users
**Mitigation**:
- Sane defaults (3 days before due)
- Granular channel controls
- Quiet hours enforcement
- Weekly digest option
- Easy unsubscribe

### Risk 3: Timezone/Quiet Hours Bugs
**Problem**: Complex timezone logic can have edge cases
**Mitigation**:
- Centralize timezone utilities
- Unit test all timezone conversions
- Test with multiple timezones
- Log all scheduling decisions
- Allow manual retry

### Risk 4: Provider Lock-In (Firebase)
**Problem**: Hard to switch providers later
**Mitigation**:
- Abstract provider interface
- Support multiple providers (FCM fallback)
- Document migration path
- Keep raw Web Push code

### Risk 5: Delivery Failures
**Problem**: Push/email providers can fail
**Mitigation**:
- Retry logic with exponential backoff
- Multi-channel delivery (push + email)
- Monitor delivery rates
- Alert on high failure rates
- Dead-letter queue for manual review

---

## 🔄 Future Enhancements (Post-MVP)

### Phase 2: Enhanced Notifications
- **Rich content**: Images, charts in notifications
- **Interactive actions**: "Mark as paid" button
- **Smart scheduling**: ML-based optimal send times
- **Personalized content**: Based on user behavior
- **Multi-language**: Support 5+ languages

### Phase 3: Advanced Features
- **WhatsApp notifications**: Alternative channel
- **SMS fallback**: For critical notifications
- **Voice notifications**: For accessibility
- **Wearable support**: Apple Watch, Wear OS
- **Custom notification sounds**: User-selectable

### Phase 4: Native App Layer (React Native)
**Scope**: Thin enhancement layer only
- **Local notifications**: Independent of browser
- **Widgets**: Today widget, home screen widget
- **App Intents**: Deep Siri integration
- **Background sync**: Sync transactions offline
- **Face ID/Touch ID**: Biometric auth
- **Quick actions**: 3D Touch shortcuts

**Integration Approach**:
- Reuse existing APIs (no business logic duplication)
- Share TypeScript types and schemas
- Minimal maintenance overhead
- Optional install (PWA remains primary)

---

## 📚 Resources & References

### Documentation
- [Web Push API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)

### Tools
- [Lighthouse PWA Audit](https://developer.chrome.com/docs/lighthouse/pwa/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox (Google)](https://developer.chrome.com/docs/workbox/)
- [Firebase Console](https://console.firebase.google.com/)
- [SendGrid Templates](https://sendgrid.com/dynamic_templates)

### Code Examples
- [Next.js PWA Example](https://github.com/vercel/next.js/tree/canary/examples/progressive-web-app)
- [Web Push Notifications](https://github.com/web-push-libs/web-push)
- [Service Worker Recipes](https://github.com/GoogleChrome/samples/tree/gh-pages/service-worker)

---

## 🎯 Next Immediate Actions

### Week 1: PWA Foundation
**Days 1-2**: PWA Shell
- [ ] Create manifest.json
- [ ] Generate app icons (all sizes)
- [ ] Implement service worker
- [ ] Add PWA metadata to layout.tsx
- [ ] Test installation on iOS/Android

**Days 3-4**: Offline Support
- [ ] Implement offline detection
- [ ] Create offline fallback page
- [ ] Add skeleton loaders
- [ ] Cache critical assets
- [ ] Test offline mode

**Day 5**: Testing & Refinement
- [ ] Run Lighthouse audit (target: 100)
- [ ] Test on real devices
- [ ] Fix any issues
- [ ] Document limitations

### Week 2: Push Notifications
**Days 1-2**: Firebase Cloud Messaging Setup
- [ ] Create Firebase project (see FIREBASE_FCM_SETUP.md)
- [ ] Configure Cloud Messaging
- [ ] Integrate Firebase SDK
- [ ] Test basic push notification

**Days 3-4**: Subscription Flow
- [ ] Build permission request UI
- [ ] Implement subscription capture
- [ ] Create API endpoints
- [ ] Build settings UI
- [ ] Test end-to-end flow

**Day 5**: Database Integration
- [ ] Run migration 001
- [ ] Test subscription storage
- [ ] Verify RLS policies
- [ ] Test preferences updates

### Week 3: Server-Side Dispatch
**Days 1-3**: Edge Function
- [ ] Create dispatch-notifications function
- [ ] Implement dispatcher logic
- [ ] Add Firebase Cloud Messaging integration
- [ ] Add SendGrid integration
- [ ] Test manually

**Days 4-5**: Cron Scheduling
- [ ] Run migration 002
- [ ] Update CRON_SECRET
- [ ] Deploy Edge Function
- [ ] Test automated execution
- [ ] Monitor first deliveries

---

## ✅ Pre-Launch Checklist

### Database
- [ ] Migration 001 executed successfully
- [ ] Migration 002 executed successfully
- [ ] All tables created and verified
- [ ] RLS policies tested
- [ ] Indexes created for performance
- [ ] Triggers working correctly

### Backend
- [ ] Edge Function deployed
- [ ] All secrets configured
- [ ] Cron jobs active
- [ ] Firebase Cloud Messaging integration tested
- [ ] SendGrid integration tested
- [ ] Error handling verified

### Frontend
- [ ] PWA manifest configured
- [ ] Service worker registered
- [ ] App installable on all platforms
- [ ] Offline mode working
- [ ] Push permission flow tested
- [ ] Settings UI complete
- [ ] Deep links working

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Manual testing complete
- [ ] Performance benchmarks met
- [ ] Security audit passed

### Monitoring
- [ ] Analytics dashboard deployed
- [ ] Delivery metrics tracked
- [ ] Error logging configured
- [ ] Alert thresholds set
- [ ] Cron health monitoring active

### Documentation
- [ ] User guide updated
- [ ] API documentation complete
- [ ] Troubleshooting guide written
- [ ] Admin playbook created
- [ ] Handoff documentation ready

---

## 🎉 Conclusion

This PWA implementation will transform Kipo from a web app into a native-like experience with real-time notifications, offline support, and installable experience. The phased approach ensures we can deliver value quickly while maintaining quality.

**Key Advantages**:
- ✅ Faster time to market (2-3 weeks vs 2-3 months for native)
- ✅ Single codebase (no iOS/Android duplication)
- ✅ Instant updates (no App Store approval)
- ✅ Universal platform support
- ✅ 80% of native features with 20% of effort

**Next Steps**:
1. Review and approve this plan
2. Set up development environment
3. Begin Week 1 tasks
4. Schedule daily standups for progress tracking

---

**Document Version**: 1.0
**Last Updated**: October 6, 2025
**Owner**: Development Team
**Status**: ✅ Ready for Implementation
