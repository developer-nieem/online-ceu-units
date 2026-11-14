# CAL ACE CNA/HHA Renewal Compliance Spec

Authoritative rules for renewal-period math and compliance evaluation in CAL ACE.

---

## 3. The birthday clock — not the calendar

The certification period runs **birthday to birthday**, not January-to-December.

- The certificate is issued for **two birthdays** and **expires on the person's birthday**
  (per CDPH 283A 5/2024: "the initial CNA/HHA certificate is issued for two birthdays…
  and will expire on your birthday").
- **Year 1 = effective date → first *expiration* birthday.** Any partial time from the
  effective date to that birthday is **absorbed into Year 1** — so Year 1 is always
  ≥12 months and can run longer for a new cert. It is **never** shortened to the first
  calendar birthday after the effective date.
- **Year 2 = day after the first expiration birthday → expiration date.**
- Each year independently requires ≥12 of the 48 hours (283C: "a minimum of twelve (12)
  of the forty-eight (48) hours shall be completed in each year of the two (2) year
  certification period").

**CDPH worked example (authoritative — code must match):**
Effective 03/20/2024 · Expires 05/15/2026 →
Year 1: **03/20/2024 – 05/15/2025** · Year 2: **05/16/2025 – 05/15/2026**

**Computation:** because a valid CA cert expires on the birthday,
`year1End = expiration − 1 year` (e.g. subtractOneYear(05/15/2026) = 05/15/2025).
Do **NOT** derive year1End from the first birthday after the *effective* date —
that produces a wrong, shortened Year 1. The engine computes: `year1End =
subtractOneYear(licenseExpiresOn)`. Fixed in compliance.service.ts commit 1b2230e;
regression test added.

**Citations:**
- CDPH 283A 5/2024 (initial-cert / CE log instructions)
- CDPH 283C 7/2024 (renewal application instructions)
- **Cal. Code Regs. tit. 22, § 71839** — Renewal of Unexpired Certificates (two-year renewal cycle and 48-hour in-service/CE requirement)

> **Wrinkle for new certificates:** the effective date may be months before the
> first expiration birthday — that gap folds into Year 1, making it longer than
> 12 months. The engine handles this correctly via `subtractOneYear(expiration)`.
> Never assume two clean 12-month halves.

### Implementation map

| Layer | Module | Function |
|-------|--------|----------|
| Canonical engine | `packages/compliance/src/periods.ts` | `computeCertificationPeriods` |
| API renewal periods | `apps/api/src/credentials/compliance.service.ts` | `ensureActiveRenewalPeriod` |
| CE deadline calculator (web) | `apps/web/lib/calculate-ceu-deadline-periods.ts` | `calculateCeuDeadlinePeriods` |
| Account online progress (API) | `apps/api/src/account/california-renewal-progress.ts` | `computeCaliforniaRenewalProgress` |
| Account online progress (UI) | `packages/ui/.../calculate-california-renewal-progress.ts` | `calculateCaliforniaRenewalProgress` |

All paths must delegate to `computeCertificationPeriods` (or equivalent `subtractOneYear(expiration)` logic) — never `effective + 1 year`.
