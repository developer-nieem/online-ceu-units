# CDPH online CEU compliance (LMS behavior)

Verify all rules against current [CDPH online CE guidance](https://www.cdph.ca.gov/Programs/CHCQ/LNC/Certification/Pages/Online-CE-Courses.aspx) before production.

## What the LMS implements (192B-style online CE)

| CDPH expectation | LMS behavior |
|------------------|--------------|
| Unique user ID + password | Platform auth (`AuthModule`) |
| Interactive participation | Content blocks + knowledge checks; interaction ledger |
| Material evaluation | Final exam (`AssessmentKind.FINAL_EXAM`), server-side scoring |
| Active seat time (50 min / 1 CEU hour) | Heartbeat ledger on `enrollment.metadata.participationLedger` |
| Certificate after all requirements | `CompletionEligibilityService` + learner attestation |
| Certificate shows online CE hours | `onlineCeuHoursLabel` on certificate payload |
| Records retained | Completions, attempts, certificates, transcript, `AuditLog` |

## What is **not** in the learner portal

The following are **internal/manual** and must not be exposed to learners:

- CDPH provider **application package**
- Internal readiness checklists
- State **audit export** UI or public download routes
- Provider approval **submission journey** (wet signature, NAC filing)
- Retention policy legal text (admin settings only)

Learners see only: course title, **1 Online CE hour** wording, provider/contact placeholders, completion requirements, certificate/transcript access, support contact, and optional approval status when admins enable it.

## Admin configuration

`GET/PATCH /api/admin/compliance/settings` (admin role only) stores tenant settings under `tenants.settings.providerCompliance`:

- Provider NAC reference (internal ops)
- Provider contact info
- Record retention policy text (admin UI only)
- Certificate wording template
- Course approval status label + `showApprovalStatusToLearners`
- Default instructor, CE hours, minutes per CE hour

Per-course fields (approval status, instructor in catalog, seat time) remain in **CMS** `contentMeta.compliance`.

Future state audit exports: internal admin architecture only (`AuditLog`, completions, certificates) — no `/api/.../cdph-package` public routes.

## Learner API surfaces

| Method | Path |
|--------|------|
| GET | `/api/participation/courses/:slug/status` |
| POST | `/api/participation/courses/:slug/heartbeat` |
| GET | `/api/assessments/courses/:slug/completion-eligibility` |
| POST | `/api/assessments/courses/:slug/attest-certificate-release` |

Completion eligibility returns `onlineCe` (seat time + attestation) — not internal audit notes.

See `docs/PARTICIPATION.md`, `docs/ASSESSMENTS.md`, `docs/ADMIN.md`.
