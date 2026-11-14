import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeliveryMode, TranscriptEntryType } from '@calace/db';

import type { CertificateCeuSyncService } from './certificate-ceu-sync.service';
import type { CredentialsOrchestratorService } from './credentials-orchestrator.service';
import { TranscriptService } from './transcript.service';
import type { PrismaService } from '../prisma/prisma.service';

const BASE_PARAMS = {
  userId: 'user_test',
  completionId: 'completion_test',
  title: 'Test Course',
  ceHours: 2,
  completedOn: new Date('2025-06-01'),
  certificateId: 'cert_test',
  certificateNo: 'CERT-001',
  verificationCode: 'verify_test',
  renewalPeriodId: 'period_test',
  renewalLabel: '2024–2026',
  categorySlug: 'infection-control',
} as const;

describe('TranscriptService.appendCompletionEntry', () => {
  let service: TranscriptService;
  let mockPrisma: PrismaService;
  let createMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createMock = vi.fn().mockResolvedValue({ id: 'te_test' });

    mockPrisma = {
      transcriptEntry: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: createMock,
      },
    } as unknown as PrismaService;

    const mockOrchestrator = {} as CredentialsOrchestratorService;
    const mockCeuSync = {} as CertificateCeuSyncService;

    service = new TranscriptService(mockPrisma, mockOrchestrator, mockCeuSync);
  });

  it('records deliveryMode on the new TranscriptEntry (IN_PERSON)', async () => {
    await service.appendCompletionEntry({
      ...BASE_PARAMS,
      deliveryMode: DeliveryMode.IN_PERSON,
    });

    expect(mockPrisma.transcriptEntry.findFirst).toHaveBeenCalledWith({
      where: {
        completionId: BASE_PARAMS.completionId,
        entryType: TranscriptEntryType.COMPLETION,
      },
    });
    expect(createMock).toHaveBeenCalledOnce();
    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        deliveryMode: DeliveryMode.IN_PERSON,
      }),
    });
  });

  /**
   * Guard: create.data.deliveryMode must equal the caller-supplied value — not
   * omitted (null) and not a silent default. Reverting the create.data line
   * turns both deliveryMode tests red.
   */
  it('records deliveryMode on the new TranscriptEntry (ONLINE)', async () => {
    await service.appendCompletionEntry({
      ...BASE_PARAMS,
      deliveryMode: DeliveryMode.ONLINE,
    });

    expect(createMock).toHaveBeenCalledOnce();
    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        deliveryMode: DeliveryMode.ONLINE,
      }),
    });
  });
});
