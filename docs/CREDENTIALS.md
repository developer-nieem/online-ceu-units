# Certificates, transcript & compliance

## API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/certificates/my` | JWT | List issued certificates |
| GET | `/api/certificates/:id` | JWT | Certificate detail |
| GET | `/api/certificates/verify/certificate/:certificateNo` | Public | Verification by certificate number |
| GET | `/api/certificates/verify/:token` | Public | Legacy token lookup (same public fields) |
| POST | `/api/admin/certificates/:id/revoke` | Admin | Revoke certificate + verification token |
| POST | `/api/admin/certificates/:id/restore` | Admin | Restore revoked/archived certificate |
| POST | `/api/admin/certificates/:id/archive` | Admin | Archive certificate (public status: Archived) |
| GET | `/api/admin/certificates/:id` | Admin | Certificate detail + payload metadata |
| GET | `/api/transcript` | JWT | Transcript ledger + filters |
| GET | `/api/compliance/summary` | JWT | Renewal period + snapshot |
| GET | `/api/compliance/renewal-periods` | JWT | Renewal period history |

## Issuance flow

1. Learner meets completion eligibility (lessons, seat time, final exam, attestation)
2. `CredentialsOrchestratorService.processCompletion`:
   - Issues `Certificate` + `CertificateVerificationToken`
   - Sets `completion.ceHoursEarned` from **`courseVersion.ceHours`** (authoritative)
   - Appends `TranscriptEntry` with matching CE hours
   - Ensures `RenewalPeriod` for user

## CE hours sync (development corrections)

- **Source of truth:** `courseVersion.ceHours` (and `courses.ceHours` on catalog)
- **Display/API:** `CertificateCeuSyncService` aligns completion, certificate `payload`, and transcript when hours drift
- **Backfill:** `pnpm --filter @calace/db db:backfill-ceu-hours` (also runs at end of `pnpm db:seed`)
- **Production immutability:** Set `payload.immutable: true` or `ALLOW_CEU_CORRECTION` unset in production; corrections skipped for locked certificates

## Future services (placeholders in payload)

- PDF export: `@calace/pdf-worker` (certificate + transcript)
- QR verify: encode verification URL → `/verify-certificate/{certificateNo}` (QR not built yet)
- Public web: `/verify-certificate`, `/verify-certificate/[certificateNumber]`
- Admin: revoke / restore / archive via `/admin/certificates`
