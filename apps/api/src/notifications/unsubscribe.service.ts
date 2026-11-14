import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@calace/db';

import { PrismaService } from '../prisma/prisma.service';
import {
  NOTIFICATION_PREFERENCES_METADATA_KEY,
  mergeNotificationPreferences,
  parseNotificationPreferences,
} from './notification-preferences.types';
import {
  UNSUBSCRIBE_SCOPE,
  type UnsubscribeScope,
  buildOneClickUnsubscribeUrl,
  buildUnsubscribeUrl,
  resolveUnsubscribeSecret,
  scopeLabel,
  scopeToPreferencePatch,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
} from './unsubscribe-token.util';

export type UnsubscribeResult =
  | {
      ok: true;
      scope: UnsubscribeScope;
      label: string;
      alreadyUnsubscribed: boolean;
    }
  | { ok: false; reason: 'invalid_token' | 'user_not_found' };

/**
 * Owns the inbound unsubscribe flow (token verify + preference write) and the
 * outbound link/header builders. Depends only on ConfigService + PrismaService
 * so it never forms a cycle with NotificationsService.
 */
@Injectable()
export class UnsubscribeService {
  private readonly logger = new Logger(UnsubscribeService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private secret(): string {
    return resolveUnsubscribeSecret(this.config);
  }

  private webBaseUrl(): string {
    return (this.config.get<string>('WEB_URL') ?? 'https://onlineceunits.com').replace(
      /\/$/,
      '',
    );
  }

  /** Signed link to the confirmation page (safe GET) for an email body. */
  linkFor(tenantId: string, userId: string, scope: UnsubscribeScope): string {
    const token = signUnsubscribeToken(this.secret(), { t: tenantId, u: userId, s: scope });
    return buildUnsubscribeUrl(this.webBaseUrl(), token);
  }

  /** RFC 8058 one-click POST URL for the List-Unsubscribe-Post header. */
  oneClickLinkFor(tenantId: string, userId: string, scope: UnsubscribeScope): string {
    const token = signUnsubscribeToken(this.secret(), { t: tenantId, u: userId, s: scope });
    return buildOneClickUnsubscribeUrl(this.webBaseUrl(), token);
  }

  /** mailto: fallback target for List-Unsubscribe. */
  mailtoTarget(): string {
    return `mailto:support@onlineceunits.com?subject=unsubscribe`;
  }

  /**
   * Build the List-Unsubscribe + List-Unsubscribe-Post headers for a
   * promotional message. Including both the https one-click target and a
   * mailto fallback is what Gmail/Apple look for to show a native
   * "Unsubscribe" control and to suppress spam complaints.
   */
  headersFor(
    tenantId: string,
    userId: string,
    scope: UnsubscribeScope,
  ): Record<string, string> {
    const oneClick = this.oneClickLinkFor(tenantId, userId, scope);
    return {
      'List-Unsubscribe': `<${oneClick}>, <${this.mailtoTarget()}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
  }

  /** Decode a token without mutating anything (for the confirmation page). */
  preview(token: string): { ok: true; scope: UnsubscribeScope; label: string } | { ok: false } {
    const payload = verifyUnsubscribeToken(this.secret(), token);
    if (!payload) return { ok: false };
    return { ok: true, scope: payload.s, label: scopeLabel(payload.s) };
  }

  /** Verify a token and apply the opt-out. Idempotent. */
  async apply(token: string): Promise<UnsubscribeResult> {
    const payload = verifyUnsubscribeToken(this.secret(), token);
    if (!payload) {
      return { ok: false, reason: 'invalid_token' };
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.u, tenantId: payload.t, deletedAt: null },
      select: { metadata: true },
    });
    if (!user) {
      return { ok: false, reason: 'user_not_found' };
    }

    const meta = (user.metadata ?? {}) as Record<string, unknown>;
    const current = parseNotificationPreferences(meta);
    const patch = scopeToPreferencePatch(payload.s);

    // Detect whether this opt-out was already in effect (idempotent re-click).
    const alreadyUnsubscribed = (
      Object.entries(patch) as [keyof typeof current, boolean][]
    ).every(([key, value]) => current[key] === value);

    if (!alreadyUnsubscribed) {
      const preferences = mergeNotificationPreferences(current, patch);
      await this.prisma.user.update({
        where: { id: payload.u },
        data: {
          metadata: {
            ...meta,
            [NOTIFICATION_PREFERENCES_METADATA_KEY]: preferences,
          } as Prisma.InputJsonValue,
        },
      });
      this.logger.log(
        `[unsubscribe] user=${payload.u} scope=${payload.s} applied (${JSON.stringify(patch)})`,
      );
    } else {
      this.logger.log(
        `[unsubscribe] user=${payload.u} scope=${payload.s} already in effect (no-op)`,
      );
    }

    return {
      ok: true,
      scope: payload.s,
      label: scopeLabel(payload.s),
      alreadyUnsubscribed,
    };
  }

  scopes() {
    return UNSUBSCRIBE_SCOPE;
  }
}
