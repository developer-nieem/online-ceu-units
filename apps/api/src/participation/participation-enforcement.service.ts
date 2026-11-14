import { Injectable } from '@nestjs/common';

import {
  CLIENT_CLOCK_SKEW_SEC,
  ENGAGEMENT_WINDOW_SEC,
  HEARTBEAT_MAX_CREDIT_SEC,
  HEARTBEAT_MAX_GAP_SEC,
  HEARTBEAT_MIN_GAP_SEC,
  HEARTBEAT_PASSIVE_CREDIT_CAP_SEC,
} from './participation.constants';
import type { ParticipationHeartbeatDto } from './dto/participation-heartbeat.dto';
import { ParticipationLedgerService } from './participation-ledger.service';
import type { HeartbeatResult, ParticipationLedgerV1 } from './participation.types';

@Injectable()
export class ParticipationEnforcementService {
  constructor(private readonly ledgerService: ParticipationLedgerService) {}

  processHeartbeat(
    ledger: ParticipationLedgerV1,
    dto: ParticipationHeartbeatDto,
    serverNow = new Date(),
  ): { ledger: ParticipationLedgerV1; result: HeartbeatResult } {
    const nowIso = serverNow.toISOString();
    const nowMs = serverNow.getTime();

    if (dto.clientTimestamp) {
      const skew = Math.abs(nowMs - Date.parse(dto.clientTimestamp));
      if (Number.isFinite(skew) && skew > CLIENT_CLOCK_SKEW_SEC * 1000) {
        return this.reject(ledger, 'clock_skew', nowIso);
      }
    }

    if (dto.clientSequence <= ledger.lastClientSequence && ledger.sessionId === dto.sessionId) {
      return this.reject(ledger, 'stale_sequence', nowIso);
    }

    let next = { ...ledger };
    if (ledger.sessionId !== dto.sessionId) {
      next = this.ledgerService.appendEvent(next, 'session_start', {
        meta: { sessionId: dto.sessionId },
      });
      next.sessionId = dto.sessionId;
      next.lastHeartbeatAt = null;
    }

    next.lastClientSequence = dto.clientSequence;

    const videoPlaying = dto.videoPlaying === true;
    const audioPlaying = dto.audioPlaying === true;
    // Video still overrides hidden-tab, blur, and idle. Audio overrides idle only.
    const paused =
      !videoPlaying &&
      (!dto.tabVisible || !dto.documentFocused || (dto.idle && !audioPlaying));
    if (paused) {
      next = this.ledgerService.appendEvent(next, 'heartbeat_paused', {
        lessonId: dto.lessonId,
        reason: !dto.tabVisible
          ? 'tab_hidden'
          : !dto.documentFocused
            ? 'window_blur'
            : 'idle',
      });
      next.pausedSince = next.pausedSince ?? nowIso;
      next.lastHeartbeatAt = nowIso;

      return {
        ledger: next,
        result: {
          accepted: true,
          creditedSeconds: 0,
          activeSeconds: next.activeSeconds,
          activeMinutes: Math.floor(next.activeSeconds / 60),
          requiredMinutes: 0,
          seatTimeMet: false,
          isPaused: true,
          reason: 'paused',
        },
      };
    }

    next.pausedSince = null;

    if (dto.interactionDelta > 0) {
      next.interactionCount += dto.interactionDelta;
      next.lastInteractionAt = nowIso;
      next = this.ledgerService.appendEvent(next, 'interaction', {
        lessonId: dto.lessonId,
        meta: { delta: dto.interactionDelta },
      });
    }

    const scrollIncreased =
      dto.scrollDepthPct != null && dto.scrollDepthPct > next.lastScrollDepthPct;
    if (scrollIncreased) {
      next.lastScrollDepthPct = dto.scrollDepthPct!;
    }

    const elapsedSec = this.elapsedSeconds(next.lastHeartbeatAt, nowMs);
    if (elapsedSec < HEARTBEAT_MIN_GAP_SEC) {
      next.lastHeartbeatAt = nowIso;
      return {
        ledger: next,
        result: {
          accepted: true,
          creditedSeconds: 0,
          activeSeconds: next.activeSeconds,
          activeMinutes: Math.floor(next.activeSeconds / 60),
          requiredMinutes: 0,
          seatTimeMet: false,
          isPaused: false,
          reason: 'too_soon',
        },
      };
    }

    const cappedElapsed = Math.min(elapsedSec, HEARTBEAT_MAX_GAP_SEC);
    // Full credit requires an interaction on this heartbeat, or playing media.
    // ENGAGEMENT_WINDOW_SEC is 0, so time after the last interaction is not credited
    // even while the client still sends idle:false (visible pause is 6 minutes).
    const engaged =
      videoPlaying ||
      audioPlaying ||
      this.isRecentlyEngaged(next, nowMs, dto.interactionDelta > 0);

    let creditSec = 0;
    if (engaged) {
      creditSec = Math.min(cappedElapsed, HEARTBEAT_MAX_CREDIT_SEC);
    } else if (scrollIncreased) {
      creditSec = Math.min(cappedElapsed, HEARTBEAT_PASSIVE_CREDIT_CAP_SEC);
    }

    if (creditSec > 0) {
      next.activeSeconds += creditSec;
      next.lastActiveAt = nowIso;
      if (dto.lessonId) {
        next.lessonActiveSeconds = {
          ...next.lessonActiveSeconds,
          [dto.lessonId]: (next.lessonActiveSeconds[dto.lessonId] ?? 0) + creditSec,
        };
      }
      next = this.ledgerService.appendEvent(next, 'heartbeat_accepted', {
        secondsCredited: creditSec,
        lessonId: dto.lessonId,
        meta: { elapsedSec: cappedElapsed, engaged },
      });
    }

    next = this.ledgerService.syncSeatTimeMinutes(next);
    next.lastHeartbeatAt = nowIso;

    return {
      ledger: next,
      result: {
        accepted: true,
        creditedSeconds: creditSec,
        activeSeconds: next.activeSeconds,
        activeMinutes: Math.floor(next.activeSeconds / 60),
        requiredMinutes: 0,
        seatTimeMet: false,
        isPaused: false,
      },
    };
  }

  recordInteractionEvidence(
    ledger: ParticipationLedgerV1,
    type: 'lesson_view' | 'block_progress' | 'quiz_activity',
    lessonId?: string,
    meta?: Record<string, unknown>,
  ): ParticipationLedgerV1 {
    const nowIso = new Date().toISOString();
    let next: ParticipationLedgerV1 = {
      ...ledger,
      interactionCount: ledger.interactionCount + 1,
      lastInteractionAt: nowIso,
      lastActiveAt: nowIso,
    };
    next = this.ledgerService.appendEvent(next, 'interaction', {
      lessonId,
      meta: { source: type, ...meta },
    });
    next = this.ledgerService.appendEvent(next, type, { lessonId, meta });
    return next;
  }

  private isRecentlyEngaged(
    ledger: ParticipationLedgerV1,
    nowMs: number,
    freshInteraction: boolean,
  ): boolean {
    if (freshInteraction) return true;
    if (!ledger.lastInteractionAt) return false;
    const delta = nowMs - Date.parse(ledger.lastInteractionAt);
    return Number.isFinite(delta) && delta <= ENGAGEMENT_WINDOW_SEC * 1000;
  }

  private elapsedSeconds(lastHeartbeatAt: string | null, nowMs: number): number {
    if (!lastHeartbeatAt) return HEARTBEAT_MIN_GAP_SEC;
    const delta = Math.floor((nowMs - Date.parse(lastHeartbeatAt)) / 1000);
    return Number.isFinite(delta) && delta > 0 ? delta : HEARTBEAT_MIN_GAP_SEC;
  }

  private reject(
    ledger: ParticipationLedgerV1,
    reason: string,
    nowIso: string,
  ): { ledger: ParticipationLedgerV1; result: HeartbeatResult } {
    const next = this.ledgerService.appendEvent(
      { ...ledger, lastHeartbeatAt: nowIso },
      'heartbeat_rejected',
      { reason },
    );
    return {
      ledger: next,
      result: {
        accepted: false,
        creditedSeconds: 0,
        activeSeconds: ledger.activeSeconds,
        activeMinutes: Math.floor(ledger.activeSeconds / 60),
        requiredMinutes: 0,
        seatTimeMet: false,
        isPaused: false,
        reason,
      },
    };
  }
}
