import { describe, expect, it } from 'vitest';

import type { ParticipationHeartbeatDto } from './dto/participation-heartbeat.dto';
import { ParticipationEnforcementService } from './participation-enforcement.service';
import { ParticipationLedgerService } from './participation-ledger.service';
import type { ParticipationLedgerV1 } from './participation.types';

const SESSION = 'sess_inactive_credit';

function beat(
  at: Date,
  sequence: number,
  overrides: Partial<ParticipationHeartbeatDto> = {},
): ParticipationHeartbeatDto {
  return {
    sessionId: SESSION,
    clientSequence: sequence,
    clientTimestamp: at.toISOString(),
    tabVisible: true,
    documentFocused: true,
    idle: false,
    interactionDelta: 0,
    scrollDepthPct: 40,
    videoPlaying: false,
    audioPlaying: false,
    ...overrides,
  };
}

describe('ParticipationEnforcementService inactive credit', () => {
  const ledgerService = new ParticipationLedgerService();
  const enforcement = new ParticipationEnforcementService(ledgerService);

  function run(ledger: ParticipationLedgerV1, at: Date, sequence: number, overrides?: Partial<ParticipationHeartbeatDto>) {
    return enforcement.processHeartbeat(ledger, beat(at, sequence, overrides), at);
  }

  it('credits 0 after the last interaction even while the client still sends idle:false', () => {
    const start = new Date('2026-10-01T16:00:00.000Z');
    let ledger = ledgerService.empty();

    const first = run(ledger, start, 1, { interactionDelta: 1 });
    expect(first.result.creditedSeconds).toBeGreaterThan(0);
    expect(first.result.isPaused).toBe(false);
    ledger = first.ledger;
    const creditedOnInteraction = ledger.activeSeconds;

    // Old engagement window was 300s and would have credited these.
    const inactiveOffsetsSec = [30, 120, 300, 330, 359];
    let sequence = 1;
    for (const offsetSec of inactiveOffsetsSec) {
      sequence += 1;
      const at = new Date(start.getTime() + offsetSec * 1000);
      const next = run(ledger, at, sequence, { interactionDelta: 0, idle: false });
      expect(next.result.creditedSeconds).toBe(0);
      expect(next.result.activeSeconds).toBe(creditedOnInteraction);
      expect(next.result.isPaused).toBe(false);
      ledger = next.ledger;
    }

    const pausedAt = new Date(start.getTime() + 360 * 1000);
    const paused = run(ledger, pausedAt, sequence + 1, { interactionDelta: 0, idle: true });
    expect(paused.result.creditedSeconds).toBe(0);
    expect(paused.result.activeSeconds).toBe(creditedOnInteraction);
    expect(paused.result.isPaused).toBe(true);
  });

  it('still credits playing video or audio, and still pauses on hidden tab or blur', () => {
    const start = new Date('2026-10-01T17:00:00.000Z');
    let ledger = ledgerService.empty();
    ledger = run(ledger, start, 1, { interactionDelta: 1 }).ledger;

    const videoAt = new Date(start.getTime() + 60_000);
    const video = run(ledger, videoAt, 2, {
      interactionDelta: 0,
      idle: true,
      videoPlaying: true,
      tabVisible: false,
      documentFocused: false,
    });
    expect(video.result.creditedSeconds).toBeGreaterThan(0);
    expect(video.result.isPaused).toBe(false);

    const audioAt = new Date(start.getTime() + 120_000);
    const audio = run(video.ledger, audioAt, 3, {
      interactionDelta: 0,
      idle: true,
      audioPlaying: true,
    });
    expect(audio.result.creditedSeconds).toBeGreaterThan(0);
    expect(audio.result.isPaused).toBe(false);

    const hiddenAt = new Date(start.getTime() + 180_000);
    const hidden = run(audio.ledger, hiddenAt, 4, {
      interactionDelta: 1,
      audioPlaying: true,
      tabVisible: false,
    });
    expect(hidden.result.creditedSeconds).toBe(0);
    expect(hidden.result.isPaused).toBe(true);

    const blurAt = new Date(start.getTime() + 240_000);
    const blur = run(hidden.ledger, blurAt, 5, {
      interactionDelta: 1,
      documentFocused: false,
    });
    expect(blur.result.creditedSeconds).toBe(0);
    expect(blur.result.isPaused).toBe(true);
  });

  it('resumes credit on the next interaction after an uncredited idle gap', () => {
    const start = new Date('2026-10-01T18:00:00.000Z');
    let ledger = ledgerService.empty();
    ledger = run(ledger, start, 1, { interactionDelta: 1 }).ledger;
    const afterIdle = run(ledger, new Date(start.getTime() + 240_000), 2, { interactionDelta: 0 });
    expect(afterIdle.result.creditedSeconds).toBe(0);

    const resumed = run(afterIdle.ledger, new Date(start.getTime() + 270_000), 3, {
      interactionDelta: 1,
      idle: false,
    });
    expect(resumed.result.creditedSeconds).toBeGreaterThan(0);
    expect(resumed.result.isPaused).toBe(false);
    expect(resumed.result.activeSeconds).toBeGreaterThan(afterIdle.result.activeSeconds);
  });
});
