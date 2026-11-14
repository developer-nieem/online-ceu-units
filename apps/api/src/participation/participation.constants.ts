import { CDPH_ONLINE_CEU, requiredSeatTimeMinutes } from '../assessments/cdph-compliance.constants';

export { CDPH_ONLINE_CEU, requiredSeatTimeMinutes };

/** Client should send heartbeats about every 30 seconds while actively learning. */
export const HEARTBEAT_EXPECTED_INTERVAL_SEC = 30;

/** Ignore heartbeats arriving sooner than this (anti-spam). */
export const HEARTBEAT_MIN_GAP_SEC = 10;

/** Gaps longer than this are capped (anti-fast-forward / closed-tab catch-up). */
export const HEARTBEAT_MAX_GAP_SEC = 90;

/** Maximum seconds credited per accepted heartbeat. */
export const HEARTBEAT_MAX_CREDIT_SEC = 45;

/** Passive reading credit cap per heartbeat when tab is active but no new interaction. */
export const HEARTBEAT_PASSIVE_CREDIT_CAP_SEC = 15;

/**
 * Seconds after the last interaction that a heartbeat with no new interaction
 * may still receive full credit. Zero: only a heartbeat that itself contains
 * an interaction (or playing media) is engaged. Inactive time before the
 * client idle pause must not count toward seat time.
 */
export const ENGAGEMENT_WINDOW_SEC = 0;

/** Ring buffer size for participation events stored on enrollment metadata. */
export const LEDGER_EVENT_CAP = 80;

/** Max client clock skew accepted for heartbeat timestamps. */
export const CLIENT_CLOCK_SKEW_SEC = 120;
