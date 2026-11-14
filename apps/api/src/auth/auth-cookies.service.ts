import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { generateSecureToken } from '../common/crypto.util';
import { AUTH_COOKIE, AUTH_HEADER } from '../config/auth.constants';

@Injectable()
export class AuthCookiesService {
  constructor(private readonly config: ConfigService) {}

  private get isProduction() {
    return this.config.get('NODE_ENV') === 'production';
  }

  /** HTTPS sites must use Secure cookies or Chrome will not overwrite an older Secure calace_csrf. */
  private get useSecureCookies() {
    if (this.isProduction) return true;
    const webUrl = this.config.get<string>('WEB_URL', '');
    return webUrl.startsWith('https://');
  }

  issueCsrfToken(res: Response): string {
    const token = generateSecureToken(24);
    res.cookie(AUTH_COOKIE.CSRF, token, {
      httpOnly: false,
      secure: this.useSecureCookies,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return token;
  }

  setAccessCookie(res: Response, accessToken: string) {
    const accessMaxAge = this.parseDurationMs(
      this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      15 * 60 * 1000,
    );

    res.cookie(AUTH_COOKIE.ACCESS, accessToken, {
      httpOnly: true,
      secure: this.useSecureCookies,
      sameSite: 'lax',
      path: '/',
      maxAge: accessMaxAge,
    });
  }

  setRefreshCookie(res: Response, refreshToken: string) {
    const refreshMaxAge = this.parseDurationMs(
      this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      7 * 24 * 60 * 60 * 1000,
    );

    res.cookie(AUTH_COOKIE.REFRESH, refreshToken, {
      httpOnly: true,
      secure: this.useSecureCookies,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshMaxAge,
    });
  }

  setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    this.setAccessCookie(res, accessToken);
    this.setRefreshCookie(res, refreshToken);
  }

  clearAuthCookies(res: Response) {
    res.clearCookie(AUTH_COOKIE.ACCESS, { path: '/' });
    res.clearCookie(AUTH_COOKIE.REFRESH, { path: '/' });
    res.clearCookie(AUTH_COOKIE.CSRF, { path: '/' });
  }

  getCsrfHeaderName() {
    return AUTH_HEADER.CSRF;
  }

  private parseDurationMs(value: string, fallback: number): number {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) return fallback;
    const amount = Number(match[1]);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';
    const multipliers: Record<'s' | 'm' | 'h' | 'd', number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return amount * multipliers[unit];
  }
}
