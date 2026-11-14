export type ParticipationEventType =
  | 'heartbeat_accepted'
  | 'heartbeat_paused'
  | 'heartbeat_rejected'
  | 'interaction'
  | 'lesson_view'
  | 'block_progress'
  | 'quiz_activity'
  | 'session_start';

export type ParticipationEvent = {
  at: string;
  type: ParticipationEventType;
  secondsCredited?: number;
  lessonId?: string;
  reason?: string;
  meta?: Record<string, unknown>;
};

export type ParticipationLedgerV1 = {
  version: 1;
  activeSeconds: number;
  interactionCount: number;
  sessionId: string | null;
  lastHeartbeatAt: string | null;
  lastActiveAt: string | null;
  lastInteractionAt: string | null;
  lastClientSequence: number;
  lastScrollDepthPct: number;
  pausedSince: string | null;
  lessonActiveSeconds: Record<string, number>;
  events: ParticipationEvent[];
  /** Floor(activeSeconds/60) — kept for CDPH eligibility checks */
  seatTimeMinutes: number;
  deliveryMode: 'online';
};

export type ParticipationComplianceStatus = {
  activeSeconds: number;
  activeMinutes: number;
  requiredMinutes: number;
  requiredSeconds: number;
  remainingMinutes: number;
  remainingSeconds: number;
  percentComplete: number;
  seatTimeMet: boolean;
  interactionCount: number;
  isPaused: boolean;
  lastActiveAt: string | null;
  examEligible: boolean;
  certificateEligible: boolean;
  deliveryMode: 'online';
  minutesPerCeuHour: number;
  reasons: string[];
  ledgerSummary: {
    sessionId: string | null;
    recentEventCount: number;
    lastHeartbeatAt: string | null;
  };
};

export type HeartbeatResult = {
  accepted: boolean;
  creditedSeconds: number;
  activeSeconds: number;
  activeMinutes: number;
  requiredMinutes: number;
  seatTimeMet: boolean;
  isPaused: boolean;
  reason?: string;
};
