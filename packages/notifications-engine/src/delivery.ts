import type { DeliveryChannel, DeliveryRecord } from './types';

export type DeliveryRequest = {
  tenantId: string;
  userId: string;
  toEmail?: string;
  title: string;
  body: string;
  channels: DeliveryChannel[];
};

export type DeliveryResult = {
  channel: DeliveryChannel;
  status: DeliveryRecord['status'];
  placeholder?: boolean;
};

/** Channel adapters — SMS/PUSH are stubs until providers are integrated. */
export interface ChannelAdapter {
  readonly channel: DeliveryChannel;
  deliver(request: DeliveryRequest): Promise<DeliveryResult>;
}

export class InAppChannelAdapter implements ChannelAdapter {
  readonly channel = 'IN_APP' as const;

  async deliver(): Promise<DeliveryResult> {
    return { channel: 'IN_APP', status: 'DELIVERED' };
  }
}

export class EmailChannelAdapter implements ChannelAdapter {
  readonly channel = 'EMAIL' as const;

  async deliver(request: DeliveryRequest): Promise<DeliveryResult> {
    if (!request.toEmail) {
      return { channel: 'EMAIL', status: 'SKIPPED' };
    }
    return { channel: 'EMAIL', status: 'PENDING', placeholder: true };
  }
}

export class SmsChannelAdapter implements ChannelAdapter {
  readonly channel = 'SMS' as const;

  async deliver(): Promise<DeliveryResult> {
    return { channel: 'SMS', status: 'SKIPPED', placeholder: true };
  }
}

export class PushChannelAdapter implements ChannelAdapter {
  readonly channel = 'PUSH' as const;

  async deliver(): Promise<DeliveryResult> {
    return { channel: 'PUSH', status: 'SKIPPED', placeholder: true };
  }
}

export function createDefaultAdapters(): ChannelAdapter[] {
  return [
    new InAppChannelAdapter(),
    new EmailChannelAdapter(),
    new SmsChannelAdapter(),
    new PushChannelAdapter(),
  ];
}
