# Admin operational analytics

Internal intelligence dashboard for CAL ACE administrators at `/admin/analytics`.

## API

| Method | Path | Role |
|--------|------|------|
| GET | `/api/admin/analytics` | `admin` |

Single aggregated response — optimized for one SSR fetch, not a full BI warehouse.

## Data sources

| Section | Models / fields |
|---------|-----------------|
| Overview | `User`, `Enrollment`, `Completion`, `Certificate`, `AssessmentAttempt` |
| Participation | `Enrollment.metadata.participationLedger` |
| Course intelligence | Enrollments + attempts grouped by `Course` |
| Learner intelligence | `User.lastLoginAt`, progress metadata, exam failures |
| Missed questions | `AssessmentAttempt.metadata.gradedResults` |
| Trends | Last 30 days enrollments / completions / certs (8-week buckets) |
| Timeline | `AuditLog` (latest 40) |

## Performance notes

- Enrollment ledger scan capped at **800** rows (most recent).
- Exam attempt scan capped at **300** submitted attempts.
- Certificate breakdown capped at **500** issued rows.
- When `enrollmentScanCapped` is true, course/participation metrics reflect the sample only.

## Placeholders (not implemented)

- AI completion-risk predictions
- ML participation anomaly detection
- Learner retention cohort charts
- Public certificate verification analytics

## Test

```bash
pnpm dev
# Login: support@cna.school → /admin/analytics
curl -b "calace_access=..." http://localhost:3001/api/admin/analytics
```
