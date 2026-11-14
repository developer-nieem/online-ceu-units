import type { ParticipationLedgerV1 } from '../participation/participation.types';

export function parseParticipationLedger(
  metadata: unknown,
): ParticipationLedgerV1 | null {
  const meta = (metadata ?? {}) as Record<string, unknown>;
  const ledger = meta.participationLedger as ParticipationLedgerV1 | undefined;
  if (!ledger || ledger.version !== 1) return null;
  return ledger;
}

export function enrollmentProgressPct(metadata: unknown): number {
  const meta = (metadata ?? {}) as { progressPct?: number };
  return Number(meta.progressPct ?? 0);
}

export function weekStartKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export function lastNWeekKeys(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    keys.push(weekStartKey(d));
  }
  return keys;
}

export function bucketByWeek(
  dates: Date[],
  weeks: string[],
): { week: string; count: number }[] {
  const counts = new Map<string, number>(weeks.map((w) => [w, 0]));
  for (const d of dates) {
    const key = weekStartKey(d);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return weeks.map((week) => ({ week, count: counts.get(week) ?? 0 }));
}

export function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}
