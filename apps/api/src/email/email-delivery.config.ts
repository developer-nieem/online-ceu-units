import { ConfigService } from '@nestjs/config';

import { SUPPORT_EMAIL_PLACEHOLDER } from '../notifications/notification-preferences.types';
import { diagnoseSmtpEnv } from './smtp-error.util';

export const DEFAULT_SMTP_FROM = `Online CE Units - CAL ACE <${SUPPORT_EMAIL_PLACEHOLDER}>`;

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
};

export function resolveSmtpFrom(config: ConfigService): string {
  const from = config.get<string>('SMTP_FROM')?.trim();
  return from && from.length > 0 ? from : DEFAULT_SMTP_FROM;
}

export function isSmtpConfigured(config: ConfigService): boolean {
  return diagnoseSmtpEnvFromConfig(config).configured;
}

export function diagnoseSmtpEnvFromConfig(config: ConfigService) {
  return diagnoseSmtpEnv((key) => config.get<string>(key));
}

export function resolveSmtpConfig(config: ConfigService): SmtpConfig | null {
  if (!isSmtpConfigured(config)) return null;

  const host = config.get<string>('SMTP_HOST')!.trim();
  const user = config.get<string>('SMTP_USER')!.trim();
  const password = config.get<string>('SMTP_PASSWORD')!.trim();
  const portRaw = config.get<string>('SMTP_PORT')?.trim();
  const port = portRaw ? Number(portRaw) : 587;
  const secure =
    config.get<string>('SMTP_SECURE')?.trim() === 'true' || port === 465;

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user,
    password,
    from: resolveSmtpFrom(config),
  };
}
