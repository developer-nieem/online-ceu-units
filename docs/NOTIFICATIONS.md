# Notifications, Messaging & Reminder Engine

CAL ACE learner communication layer: in-app notification center, delivery abstraction, scheduled reminders, and admin messaging.

## Architecture

```
@calace/notifications-engine (shared types, copy, channel adapters)
        │
        ▼
apps/api/src/notifications/
  NotificationDeliveryService   → channel adapters (IN_APP, EMAIL placeholder, SMS/PUSH stub)
  NotificationEmitterService  → typed events + audit + cooldown
  LearnerNotificationsService   → inbox CRUD, preferences, continue-learning
  ReminderEngineService         → scheduled_reminders queue + processor
  AdminMessagingService         → announcements, learner notices, course updates
```

### Data model (Prisma)

| Model | Purpose |
|-------|---------|
| `Notification` | Extended with `category`, `notificationType`, `actionHref`, `archivedAt` |
| `NotificationPreference` | Per-user JSON preferences (channels/categories placeholders) |
| `ScheduledReminder` | Deduped future reminders (`dedupeKey`, `scheduledFor`, `status`) |
| `Announcement` | Admin-authored broadcasts (`audience`, optional `courseId`) |

In-app rows use `channel = IN_APP`, `status = DELIVERED`. Email rows are separate records with `PENDING` placeholder logging.

### Event hooks

| Trigger | Notification type |
|---------|-------------------|
| Enrollment | `ENROLLMENT_CONFIRMATION` + schedule reminders |
| Final exam start (first eligible) | `EXAM_UNLOCK` (once per enrollment) |
| Exam submit | `EXAM_RESULT` |
| Certificate orchestration | `CERTIFICATE_ISSUED`, `TRANSCRIPT_UPDATE` |
| CMS publish | `CMS_PUBLISH` (enrolled learners, max 100) |
| Admin announcement | `ADMIN_ANNOUNCEMENT` |

Cooldowns (hours) reduce spam: course reminder 48h, inactivity 168h, participation warning 24h.

## API routes

**Learner** (`/api/notifications`)

- `GET /` — inbox
- `GET /unread-count`
- `GET /continue-learning`
- `GET /preferences` / `PATCH /preferences`
- `PATCH /read-all`, `PATCH /:id/read`, `PATCH /:id/archive`

**Admin** (`/api/admin/messaging`, admin role)

- `POST /announcements`
- `POST /learner-notices`
- `POST /course-updates`
- `POST /reminders/process`
- `POST /reminders/scan-attestation`

## Reminder scheduling

On enroll, reminders are scheduled:

- `UNFINISHED_COURSE` — +3 days
- `INACTIVITY` — +7 days

`POST /admin/messaging/reminders/process` processes due rows, maps reminder type → notification type, skips completed/cancelled enrollments.

Attestation scan (`scan-attestation`) schedules `INCOMPLETE_ATTESTATION` for active enrollments ≥80% progress without attestation.

Placeholders: `EXPIRATION_PLACEHOLDER`, `SUBSCRIPTION_RENEWAL_PLACEHOLDER`, `COHORT_MESSAGING_PLACEHOLDER`.

## Future integrations

### Email

`EmailChannelAdapter` returns `PENDING` with `placeholder: true`. Replace adapter implementation with SendGrid/SES; keep dual-write pattern (IN_APP + EMAIL rows). Provider/support routing placeholder: `support@cna.school`.

### SMS / Push

`SmsChannelAdapter` and `PushChannelAdapter` return `SKIPPED`. Wire Twilio/FCM in `NotificationDeliveryService` without changing emitter APIs.

### AI / automation

`NotificationPayloadV1.automationHooks` and `ReminderCopyProvider` interface in `@calace/notifications-engine` support future:

- AI-generated reminder copy
- Adaptive scheduling via `EngagementScoringPlaceholder`
- Marketing automation (disabled in default preferences)

## Testing

1. Apply migration: `pnpm db:migrate` (or `pnpm db:push` in dev).
2. Build packages: `pnpm --filter @calace/notifications-engine build`
3. Start stack: `pnpm dev`
4. Sign in as learner, enroll in a course → check `/notifications` and dashboard widget.
5. Progress to exam eligibility → start exam → `EXAM_UNLOCK` / `EXAM_RESULT` notifications.
6. Complete course path → certificate + transcript notifications.
7. Admin: `/admin/messaging` → publish announcement; run reminder processor.
8. CMS publish → enrolled learners receive `CMS_PUBLISH` (if enrolled).

Admin seed: `support@cna.school` / `SuccesS8@8`
