/**
 * Display timezone for learner-facing completion/issue dates on legal artifacts
 * (certificates and transcripts).
 *
 * Pinned to California (CDPH provider) so a course finished at 11pm Pacific shows
 * the learner's actual local completion date, not the next UTC day.
 *
 * MULTI-STATE TODO: when the platform serves other states/professions, this must
 * become a per-tenant setting (rules-as-settings), not a hardcoded constant.
 * Changing the source here is the single point of change.
 */
export const CALACE_DISPLAY_TIMEZONE = 'America/Los_Angeles';
