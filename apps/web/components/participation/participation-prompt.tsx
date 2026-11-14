'use client';

import { Card, CardContent } from '@calace/ui/components/ui/card';

export function ParticipationPrompt({
  title = 'Continue participating',
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="pt-4 text-sm text-amber-950">
        <p className="font-medium">{title}</p>
        <p className="mt-1">{message}</p>
      </CardContent>
    </Card>
  );
}

export function ExamParticipationLock({
  activeMinutes,
  requiredMinutes,
  remainingMinutes,
  examEligible,
}: {
  activeMinutes: number;
  requiredMinutes: number;
  remainingMinutes?: number;
  examEligible: boolean;
}) {
  if (examEligible) return null;

  const remaining =
    remainingMinutes ?? Math.max(0, requiredMinutes - activeMinutes);

  return (
    <ParticipationPrompt
      title="Final exam locked"
      message={`Active participation required: ${activeMinutes} of ${requiredMinutes} minutes completed (${remaining} minute${remaining === 1 ? '' : 's'} remaining). Return to course lessons, keep this tab active, and interact with lesson content. The timer pauses when the tab is hidden or you are idle.`}
    />
  );
}

export function CertificateParticipationLock({
  activeMinutes,
  requiredMinutes,
  remainingMinutes,
  seatTimeMet,
}: {
  activeMinutes: number;
  requiredMinutes: number;
  remainingMinutes?: number;
  seatTimeMet: boolean;
}) {
  if (seatTimeMet) return null;

  const remaining =
    remainingMinutes ?? Math.max(0, requiredMinutes - activeMinutes);

  return (
    <ParticipationPrompt
      title="Certificate not yet available"
      message={`California requires ${requiredMinutes} minutes of active participation per CEU hour. You have ${activeMinutes} of ${requiredMinutes} minutes so far — about ${remaining} more minute${remaining === 1 ? '' : 's'} reviewing course material with this tab active and engaged. The timer pauses when you switch tabs or go idle.`}
    />
  );
}
