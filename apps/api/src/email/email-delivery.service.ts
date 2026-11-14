import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lookup as dnsLookup } from 'node:dns';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { Transporter } from 'nodemailer';

import { SUPPORT_EMAIL_PLACEHOLDER } from '../notifications/notification-preferences.types';
import {
  diagnoseSmtpEnvFromConfig,
  isSmtpConfigured,
  resolveSmtpConfig,
  resolveSmtpFrom,
} from './email-delivery.config';
import {
  classifySmtpError,
  diagnoseSmtpEnv,
  formatSafeSmtpStatus,
  formatSmtpErrorLog,
  gmailAuthFailureHint,
  type SmtpErrorCategory,
} from './smtp-error.util';

export type TransactionalEmailKind =
  | 'email_verification'
  | 'password_reset'
  | 'welcome'
  | 'ceu_completion'
  | 'certificate_ready'
  | 'enrollment_confirmed'
  | 'payment_received'
  | 'exam_result'
  | 'referral_used'
  | 'referral_converted'
  | 'renewal_reminder'
  | 'behind_pace';

export type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  kind: TransactionalEmailKind;
  replyTo?: string;
  /** Extra SMTP headers, e.g. List-Unsubscribe for promotional mail. */
  headers?: Record<string, string>;
};

export type EmailDeliveryResult = {
  delivered: boolean;
  mode: 'smtp' | 'development';
  smtpConfigured: boolean;
  messageId?: string;
  error?: string;
  errorCategory?: SmtpErrorCategory;
};

@Injectable()
export class EmailDeliveryService implements OnModuleInit {
  private readonly logger = new Logger(EmailDeliveryService.name);
  private transporter: Transporter | null = null;
  private transporterKey: string | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.logRuntimeSmtpConfig('API startup');
  }

  /** Safe runtime SMTP diagnostics (no password values). */
  logRuntimeSmtpConfig(context: string): void {
    const fromConfig = diagnoseSmtpEnvFromConfig(this.config);
    const fromProcess = diagnoseSmtpEnvFromProcess();
    this.logger.log(`${context} — ${formatSafeSmtpStatus(fromConfig, 'ConfigService')}`);
    this.logger.log(`${context} — ${formatSafeSmtpStatus(fromProcess, 'process.env')}`);
    if (fromConfig.configured !== fromProcess.configured) {
      this.logger.warn(
        `${context} — SMTP env mismatch between ConfigService (configured=${fromConfig.configured}) and process.env (configured=${fromProcess.configured}). Restart API after editing .env; ensure vars are in repo root .env or apps/api/.env.local.`,
      );
    }
    if (!fromConfig.configured) {
      this.logger.warn(
        `${context} — Transactional email will use development fallback until SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are loaded.`,
      );
    }
  }

  smtpEnabled(): boolean {
    return isSmtpConfigured(this.config);
  }

  async sendTransactionalEmail(input: SendTransactionalEmailInput): Promise<EmailDeliveryResult> {
    const replyTo = input.replyTo ?? SUPPORT_EMAIL_PLACEHOLDER;
    this.logger.log(
      `[email] ${input.kind} delivery requested → ${input.to} (smtpConfigured=${this.smtpEnabled()})`,
    );
    this.logRuntimeSmtpConfig(`before ${input.kind} send`);

    if (!isSmtpConfigured(this.config)) {
      const missing = diagnoseSmtpEnvFromConfig(this.config).missing;
      this.logDevelopmentFallback(input, missing, 'SMTP not configured at runtime');
      return {
        delivered: false,
        mode: 'development',
        smtpConfigured: false,
        errorCategory: 'missing_env',
        error: `Missing environment variables: ${missing.join(', ')}`,
      };
    }

    const smtp = resolveSmtpConfig(this.config)!;
    const attempts = this.smtpConnectionAttempts(smtp);
    let lastError: unknown;

    for (const attempt of attempts) {
      this.logger.log(
        `Attempting SMTP send — kind=${input.kind} host=${attempt.host} port=${attempt.port} secure=${attempt.secure} from=${attempt.from} to=${input.to}`,
      );

      try {
        const transport = nodemailer.createTransport(this.buildTransportOptions(attempt));
        const result = await transport.sendMail({
          from: attempt.from,
          to: input.to,
          replyTo,
          subject: input.subject,
          text: input.text,
          html: input.html,
          ...(input.headers ? { headers: input.headers } : {}),
        });

        this.transporter = transport;
        this.transporterKey = this.transporterCacheKey(attempt);
        this.logger.log(
          `SMTP send success — kind=${input.kind} to=${input.to} port=${attempt.port} messageId=${result.messageId ?? 'n/a'}`,
        );

        return {
          delivered: true,
          mode: 'smtp',
          smtpConfigured: true,
          messageId: result.messageId,
        };
      } catch (err) {
        lastError = err;
        const classified = classifySmtpError(err);
        const gmailHint = gmailAuthFailureHint(classified.category);
        const safeMessage = classified.hint
          ? `${classified.message} (${classified.hint})`
          : classified.message;

        this.logger.error(`SMTP send failed on ${attempt.host}:${attempt.port}: ${safeMessage}`);
        this.logger.error(
          formatSmtpErrorLog(classified.category, classified.message, classified.hint),
        );
        if (gmailHint) {
          this.logger.error(`[email] ${gmailHint}`);
        }

        if (!this.shouldRetrySmtpPort(classified.category)) {
          break;
        }
      }
    }

    const classified = classifySmtpError(lastError);
    if (classified.category === 'connection_timeout' || classified.category === 'connection_refused') {
      this.logger.error(
        '[email] Outbound SMTP timed out. Railway Hobby/Trial blocks Gmail ports 25/465/587 — upgrade the Railway workspace to Pro, then redeploy. Email is sent from the API (Railway), not Vercel.',
      );
    }

    return {
      delivered: false,
      mode: 'smtp',
      smtpConfigured: true,
      error: classified.message,
      errorCategory: classified.category,
    };
  }

  async verifySmtpConnection(): Promise<{
    ok: boolean;
    smtpConfigured: boolean;
    diagnostic: ReturnType<typeof diagnoseSmtpEnvFromConfig>;
    error?: string;
    errorCategory?: SmtpErrorCategory;
  }> {
    const diagnostic = diagnoseSmtpEnvFromConfig(this.config);
    if (!diagnostic.configured) {
      return {
        ok: false,
        smtpConfigured: false,
        diagnostic,
        errorCategory: 'missing_env',
        error: `Missing: ${diagnostic.missing.join(', ')}`,
      };
    }

    try {
      const transport = await this.getTransporter();
      await transport.verify();
      return { ok: true, smtpConfigured: true, diagnostic };
    } catch (err) {
      const classified = classifySmtpError(err);
      return {
        ok: false,
        smtpConfigured: true,
        diagnostic,
        error: classified.message,
        errorCategory: classified.category,
      };
    }
  }

  private buildTransportOptions(smtp: NonNullable<ReturnType<typeof resolveSmtpConfig>>): SMTPTransport.Options {
    const options = {
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.password,
      },
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 15_000,
      // Railway has no IPv6 route to Gmail — AAAA lookups hang then ENETUNREACH.
      family: 4,
      lookup: (
        hostname: string,
        _options: unknown,
        callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void,
      ) => {
        dnsLookup(hostname, { family: 4 }, callback);
      },
    } as SMTPTransport.Options;

    if (!smtp.secure && smtp.port === 587) {
      options.requireTLS = true;
    }

    return options;
  }

  private smtpConnectionAttempts(
    smtp: NonNullable<ReturnType<typeof resolveSmtpConfig>>,
  ): NonNullable<ReturnType<typeof resolveSmtpConfig>>[] {
    const attempts = [smtp];
    if (smtp.port !== 465) {
      attempts.push({ ...smtp, port: 465, secure: true });
    }
    if (smtp.port !== 587) {
      attempts.push({ ...smtp, port: 587, secure: false });
    }
    return attempts;
  }

  private shouldRetrySmtpPort(category: SmtpErrorCategory): boolean {
    return category === 'connection_timeout' || category === 'connection_refused';
  }

  private transporterCacheKey(
    smtp: NonNullable<ReturnType<typeof resolveSmtpConfig>>,
  ): string {
    return `${smtp.host}:${smtp.port}:${smtp.user}:${smtp.secure}:v4`;
  }

  private async getTransporter(): Promise<Transporter> {
    const smtp = resolveSmtpConfig(this.config)!;
    const key = this.transporterCacheKey(smtp);
    if (this.transporter && this.transporterKey === key) {
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport(this.buildTransportOptions(smtp));
    this.transporterKey = key;
    return this.transporter;
  }

  private logDevelopmentFallback(
    input: SendTransactionalEmailInput,
    missing: string[],
    reason: string,
  ) {
    this.logger.warn(
      `[email-fallback] Development mode — NOT sent via SMTP. reason="${reason}" kind=${input.kind}`,
    );
    if (input.kind === 'email_verification') {
      this.logger.warn(
        'SMTP not configured — verification email logged in development mode.',
      );
    } else {
      this.logger.warn(
        `SMTP not configured (missing: ${missing.join(', ')}) — ${input.kind} email logged in development mode.`,
      );
    }

    const from = resolveSmtpFrom(this.config);
    this.logger.log(
      [
        `[email-dev] ${input.kind}`,
        `from: ${from}`,
        `to: ${input.to}`,
        `subject: ${input.subject}`,
        '--- text ---',
        input.text,
      ].join('\n'),
    );
  }
}

function diagnoseSmtpEnvFromProcess() {
  return diagnoseSmtpEnv((key) => process.env[key]);
}
