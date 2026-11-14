import { apiFetch } from './api';

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
  deliveryMode: string;
  minutesPerCeuHour: number;
  reasons: string[];
  ledgerSummary: {
    sessionId: string | null;
    recentEventCount: number;
    lastHeartbeatAt: string | null;
  };
};

export type ParticipationHeartbeatPayload = {
  sessionId: string;
  clientSequence: number;
  clientTimestamp: string;
  lessonId?: string;
  lessonSlug?: string;
  tabVisible: boolean;
  documentFocused: boolean;
  idle: boolean;
  interactionDelta: number;
  scrollDepthPct?: number;
  /** Native HTML5 course video is currently playing (not paused/ended/seeking). */
  videoPlaying?: boolean;
  /** Native HTML5 course audio is currently playing (play/playing, not pause/ended). */
  audioPlaying?: boolean;
};

export type HeartbeatResponse = {
  accepted: boolean;
  creditedSeconds: number;
  activeSeconds: number;
  activeMinutes: number;
  requiredMinutes: number;
  seatTimeMet: boolean;
  isPaused: boolean;
  reason?: string;
  compliance: ParticipationComplianceStatus;
};

export async function fetchParticipationStatus(courseSlug: string) {
  return apiFetch<ParticipationComplianceStatus>(
    `/participation/courses/${courseSlug}/status`,
  );
}

export async function sendParticipationHeartbeat(
  courseSlug: string,
  payload: ParticipationHeartbeatPayload,
) {
  return apiFetch<HeartbeatResponse>(`/participation/courses/${courseSlug}/heartbeat`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** DEV ONLY: fills active participation to the required minimum (never available in production). */
export async function devFastForwardParticipation(courseSlug: string) {
  return apiFetch<ParticipationComplianceStatus>(
    `/participation/courses/${courseSlug}/dev-fast-forward`,
    { method: 'POST' },
  );
}
