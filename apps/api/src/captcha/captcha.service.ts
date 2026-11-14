import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type CaptchaProvider = 'turnstile' | 'recaptcha' | 'none';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  constructor(private readonly config: ConfigService) {}

  get provider(): CaptchaProvider {
    const configured = this.config.get<string>('CAPTCHA_PROVIDER', 'none').toLowerCase();
    if (configured === 'turnstile' || configured === 'recaptcha') {
      return configured;
    }
    return 'none';
  }

  async verify(token: string | undefined, remoteIp?: string): Promise<void> {
    if (this.provider === 'none') {
      if (this.config.get('NODE_ENV') === 'production') {
        throw new BadRequestException('CAPTCHA is required in production');
      }
      this.logger.debug('CAPTCHA skipped (development mode)');
      return;
    }

    if (!token) {
      throw new BadRequestException('CAPTCHA token is required');
    }

    if (this.provider === 'turnstile') {
      await this.verifyTurnstile(token, remoteIp);
      return;
    }

    await this.verifyRecaptcha(token, remoteIp);
  }

  private async verifyTurnstile(token: string, remoteIp?: string) {
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY');
    if (!secret) {
      throw new BadRequestException('Turnstile is not configured');
    }

    const body = new URLSearchParams({
      secret,
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {}),
    });

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const result = (await response.json()) as { success: boolean };
    if (!result.success) {
      throw new BadRequestException('CAPTCHA verification failed');
    }
  }

  private async verifyRecaptcha(token: string, remoteIp?: string) {
    const secret = this.config.get<string>('RECAPTCHA_SECRET_KEY');
    if (!secret) {
      throw new BadRequestException('reCAPTCHA is not configured');
    }

    const body = new URLSearchParams({
      secret,
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {}),
    });

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const result = (await response.json()) as {
      success: boolean;
      score?: number;
      action?: string;
    };
    if (!result.success) {
      throw new BadRequestException('CAPTCHA verification failed');
    }

    // v3 returns a score (0.0–1.0). v2 checkbox responses omit score.
    const minScoreRaw = this.config.get<string>('RECAPTCHA_MIN_SCORE', '0.5');
    const minScore = Number(minScoreRaw);
    if (
      typeof result.score === 'number' &&
      Number.isFinite(minScore) &&
      result.score < minScore
    ) {
      this.logger.warn(
        `reCAPTCHA v3 score ${result.score} below minimum ${minScore} (action=${result.action ?? 'n/a'})`,
      );
      throw new BadRequestException('CAPTCHA verification failed');
    }
  }
}
