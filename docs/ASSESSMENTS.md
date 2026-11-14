# Assessments & final exam

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/assessments/courses/:slug/completion-eligibility` | Full completion gate status (incl. CDPH seat time + attestation) |
| GET | `/api/assessments/courses/:slug/final-exam` | Exam config, attempts, can start |
| POST | `/api/assessments/courses/:slug/final-exam/attempts` | Start attempt (randomized questions, no answers) |
| POST | `/api/assessments/attempts/:id/submit` | Grade on server, pass/fail |
| POST | `/api/assessments/courses/:slug/acknowledge-participation` | Active participation acknowledgment |
| POST | `/api/assessments/courses/:slug/record-activity` | Optional seat-time credit (placeholder) |
| POST | `/api/assessments/courses/:slug/attest-certificate-release` | Learner attestation → course completion + certificate |

## Security

- Correct answers never sent until after `submit`
- Pass/fail and score computed in `AssessmentScoringService` (API only)
- Question subset and option order stored in attempt `metadata.presentation`

## Scoring flow

1. `startFinalExamAttempt` — random subset from question bank, store `presentation` on attempt
2. Client submits `answers` map (questionId → option id(s))
3. `AssessmentScoringService.gradeAttempt` loads `Question.correctAnswer` from DB
4. Score % vs `assessment.passingScore` → `PASSED` / `FAILED`
5. Rationales/remediation returned only in submit response

## Completion eligibility

Course marked `COMPLETED` + certificate only when:

1. Enrolled
2. All lessons `COMPLETED`
3. Block lessons: all required interactions done
4. Seat time ≥ 50 min × CE hours (`ParticipationTrackingService`)
5. Active participation acknowledged
6. Final exam `PASSED` (≤ 3 attempts)
7. Learner attestation submitted (`certificateAttestationAt`)

Certificate issuance runs in `tryFinalizeCourseCompletion` after attestation (not immediately on exam pass).

## Seed

`dementia-care` → `final-exam` with 10-question bank (`questionCount: 10` in settings; architecture supports 20+).

## CDPH

See `docs/CDPH_COMPLIANCE.md`.
