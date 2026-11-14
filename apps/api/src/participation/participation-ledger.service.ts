import { Injectable } from '@nestjs/common';

import { CDPH_ONLINE_CEU } from './participation.constants';
import { LEDGER_EVENT_CAP } from './participation.constants';
import type {
  ParticipationEvent,
  ParticipationEventType,
  ParticipationLedgerV1,
} from './participation.types';

@Injectable()
export class ParticipationLedgerService {
  empty(): ParticipationLedgerV1 {
    return {
      version: 1,
      activeSeconds: 0,
      interactionCount: 0,
      sessionId: null,
      lastHeartbeatAt: null,
      lastActiveAt: null,
      lastInteractionAt: null,
      lastClientSequence: 0,
      lastScrollDepthPct: 0,
      pausedSince: null,
      lessonActiveSeconds: {},
      events: [],
      seatTimeMinutes: 0,
      deliveryMode: CDPH_ONLINE_CEU.deliveryMode,
    };
  }

  parse(raw: unknown): ParticipationLedgerV1 {
    if (!raw || typeof raw !== 'object') return this.empty();
    const p = raw as Partial<ParticipationLedgerV1>;
    if (p.version !== 1) return this.empty();
    return {
      version: 1,
      activeSeconds: Number(p.activeSeconds ?? 0),
      interactionCount: Number(p.interactionCount ?? 0),
      sessionId: typeof p.sessionId === 'string' ? p.sessionId : null,
      lastHeartbeatAt: typeof p.lastHeartbeatAt === 'string' ? p.lastHeartbeatAt : null,
      lastActiveAt: typeof p.lastActiveAt === 'string' ? p.lastActiveAt : null,
      lastInteractionAt:
        typeof p.lastInteractionAt === 'string' ? p.lastInteractionAt : null,
      lastClientSequence: Number(p.lastClientSequence ?? 0),
      lastScrollDepthPct: Number(p.lastScrollDepthPct ?? 0),
      pausedSince: typeof p.pausedSince === 'string' ? p.pausedSince : null,
      lessonActiveSeconds:
        p.lessonActiveSeconds && typeof p.lessonActiveSeconds === 'object'
          ? { ...p.lessonActiveSeconds }
          : {},
      events: Array.isArray(p.events) ? p.events.slice(-LEDGER_EVENT_CAP) : [],
      seatTimeMinutes: Number(p.seatTimeMinutes ?? Math.floor(Number(p.activeSeconds ?? 0) / 60)),
      deliveryMode: 'online',
    };
  }

  fromEnrollmentMetadata(meta: Record<string, unknown>): ParticipationLedgerV1 {
    const participation = meta.participation;
    if (!participation || typeof participation !== 'object') return this.empty();
    const p = participation as Record<string, unknown>;
    if (p.ledger) return this.parse(p.ledger);
    // Migrate legacy seatTimeMinutes-only records
    const legacyMinutes = Number(p.seatTimeMinutes ?? 0);
    if (legacyMinutes > 0) {
      const ledger = this.empty();
      ledger.activeSeconds = legacyMinutes * 60;
      ledger.seatTimeMinutes = legacyMinutes;
      ledger.lastActiveAt = (p.lastActivityAt as string) ?? null;
      return ledger;
    }
    return this.empty();
  }

  toEnrollmentParticipation(ledger: ParticipationLedgerV1): Record<string, unknown> {
    const minutes = Math.floor(ledger.activeSeconds / 60);
    return {
      ledger,
      seatTimeMinutes: minutes,
      activeSeconds: ledger.activeSeconds,
      interactionCount: ledger.interactionCount,
      lastActivityAt: ledger.lastActiveAt,
      deliveryMode: ledger.deliveryMode,
    };
  }

  appendEvent(
    ledger: ParticipationLedgerV1,
    type: ParticipationEventType,
    partial: Omit<ParticipationEvent, 'at' | 'type'> = {},
  ): ParticipationLedgerV1 {
    const event: ParticipationEvent = {
      at: new Date().toISOString(),
      type,
      ...partial,
    };
    const events = [...ledger.events, event].slice(-LEDGER_EVENT_CAP);
    return { ...ledger, events };
  }

  syncSeatTimeMinutes(ledger: ParticipationLedgerV1): ParticipationLedgerV1 {
    return {
      ...ledger,
      seatTimeMinutes: Math.floor(ledger.activeSeconds / 60),
    };
  }
}
