import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AuditAction,
  AuthTokenType,
  NotificationStatus,
  ReferralStatus,
  Tenant,
  UserStatus,
} from '@calace/db';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';

import { resolveLearnerCityConsent } from '../account/learner-city-consent';
import { AuditService } from '../audit/audit.service';
import { generateSecureToken, hashToken } from '../common/crypto.util';
import {
  asRoleSlugs,
  AUTH_COOKIE,
  DEFAULT_TENANT_SLUG,
  ROLE_SLUG,
} from '../config/auth.constants';
import { resolveJwtAccessSecret } from '../config/jwt.config';
import { CaptchaService } from '../captcha/captcha.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthCookiesService } from './auth-cookies.service';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { SignupDto } from './dto/signup.dto';
import type { AuthUser, JwtPayload, SessionResponse } from './types/auth-user.type';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const LOGIN_WINDOW_MINUTES = 15;
const MAX_LOGIN_ATTEMPTS_PER_WINDOW = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly cookies: AuthCookiesService,
    private readonly captcha: CaptchaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async getDefaultTenant(): Promise<Tenant> {
    const slug = this.config.get<string>('DEFAULT_TENANT_SLUG', DEFAULT_TENANT_SLUG);
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug, deletedAt: null, status: 'ACTIVE' },
    });
    if (!tenant) {
      throw new BadRequestException('Tenant is not configured');
    }
    return tenant;
  }

  async signup(dto: SignupDto, req: Request, res: Response): Promise<SessionResponse> {
    const signupEnabled = this.config.get<string>('SIGNUP_ENABLED', 'false') === 'true';
    if (!signupEnabled) {
      throw new ForbiddenException('Public signup is not currently enabled.');
    }

    await this.captcha.verify(dto.captchaToken, req.ip);
    const tenant = await this.getDefaultTenant();

    const existing = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, email: dto.email.toLowerCase(), deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const learnerRole = await this.prisma.role.findFirst({
      where: { tenantId: tenant.id, slug: ROLE_SLUG.LEARNER, deletedAt: null },
    });
    if (!learnerRole) {
      throw new BadRequestException('Learner role is not configured');
    }

    const signupUserData = () => ({
      tenantId: tenant.id,
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      termsAcceptedAt: dto.termsAccepted ? new Date() : undefined,
      status: UserStatus.ACTIVE,
      referralCode: this.generateReferralCode(),
      userRoles: {
        create: { roleId: learnerRole.id, tenantId: tenant.id },
      },
      learnerProfile: {
        create: {
          tenantId: tenant.id,
          licenseNumber: dto.cnaLicenseNumber.trim(),
          ...resolveLearnerCityConsent({
            city: dto.city,
            cityConsentGiven: dto.cityConsentGiven,
          }),
        },
      },
    });

    let user;
    try {
      user = await this.prisma.user.create({
        data: signupUserData(),
        include: { userRoles: { include: { role: true } } },
      });
    } catch (err: unknown) {
      if (this.isReferralCodeCollision(err)) {
        user = await this.prisma.user.create({
          data: signupUserData(),
          include: { userRoles: { include: { role: true } } },
        });
      } else {
        throw err;
      }
    }

    if (dto.referredByCode) {
      const referrer = await this.prisma.user.findFirst({
        where: {
          referralCode: dto.referredByCode.toUpperCase(),
          tenantId: tenant.id,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (referrer && referrer.id !== user.id) {
        await this.prisma.referral.create({
          data: {
            tenantId: tenant.id,
            referrerId: referrer.id,
            referreeId: user.id,
            referreeCode: dto.referredByCode.toUpperCase(),
            status: ReferralStatus.PENDING,
            rewardAmountCents: 375,
          },
        });

        await this.prisma.user.update({
          where: { id: user.id },
          data: { referredByCode: dto.referredByCode.toUpperCase() },
        });

        await this.prisma.notification
          .create({
            data: {
              tenantId: tenant.id,
              userId: referrer.id,
              channel: 'IN_APP',
              status: 'DELIVERED',
              title: '🎉 Someone just used your referral code!',
              body: 'Your referral is currently Pending. You\'ll receive your reward after your friend completes their first qualifying purchase.',
              payload: { event: 'referral_used', referreeId: user.id },
              sentAt: new Date(),
            },
          })
          .catch(() => undefined);

        await this.audit.log({
          tenantId: tenant.id,
          actorId: user.id,
          action: AuditAction.CREATE,
          entityType: 'referral_notification',
          entityId: referrer.id,
          metadata: { event: 'referral_used', referrerId: referrer.id },
        });
      }
    }

    await this.notifications.sendWelcomeEmail(
      tenant.id,
      user.id,
      user.email,
      user.firstName ?? undefined,
    );
    await this.dispatchVerificationEmail(user.id, user.email, tenant.id, user.firstName);

    await this.audit.log({
      tenantId: tenant.id,
      actorId: user.id,
      action: AuditAction.CREATE,
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        event: 'signup',
        referredByCode: dto.referredByCode ?? null,
      },
    });

    return this.issueSession(user.id, req, res);
  }

  async login(dto: LoginDto, req: Request, res: Response): Promise<SessionResponse> {
    await this.captcha.verify(dto.captchaToken, req.ip);
    const tenant = await this.getDefaultTenant();
    const email = dto.email.toLowerCase();

    await this.assertLoginNotThrottled(email, req.ip);

    const user = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, email, deletedAt: null },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user?.passwordHash) {
      await this.recordLoginAttempt(email, tenant.id, req.ip, false);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked. Try again later.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.handleFailedLogin(user.id, email, tenant.id, req);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    await this.recordLoginAttempt(email, tenant.id, req.ip, true);

    await this.audit.log({
      tenantId: tenant.id,
      actorId: user.id,
      action: AuditAction.LOGIN,
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return this.issueSession(user.id, req, res);
  }

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.[AUTH_COOKIE.REFRESH] as string | undefined;
    if (refreshToken) {
      await this.revokeRefreshToken(refreshToken);
    }
    this.cookies.clearAuthCookies(res);
    return { success: true };
  }

  async refresh(req: Request, res: Response): Promise<SessionResponse> {
    const refreshToken = req.cookies?.[AUTH_COOKIE.REFRESH] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const session = await this.prisma.refreshSession.findFirst({
      where: {
        tokenHash: hashToken(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      this.cookies.clearAuthCookies(res);
      throw new UnauthorizedException('Refresh session is invalid');
    }

    await this.revokeRefreshSession(session.id);
    return this.issueSession(session.userId, req, res);
  }

  async getSession(user: AuthUser): Promise<SessionResponse> {
    return {
      user: {
        id: user.userId,
        email: user.email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        roles: user.roles,
        emailVerified: user.emailVerified,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto, req: Request) {
    await this.captcha.verify(dto.captchaToken, req.ip);
    const tenant = await this.getDefaultTenant();
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, email, deletedAt: null },
    });

    let resetUrl: string | undefined;

    if (user) {
      const token = await this.createAuthToken(user.id, AuthTokenType.PASSWORD_RESET);
      const webUrl = this.config.get('WEB_URL', 'http://localhost:3000');
      resetUrl = `${webUrl}/reset-password?token=${encodeURIComponent(token)}`;
      const notification = await this.notifications.sendPasswordResetEmail(
        tenant.id,
        user.id,
        user.email,
        resetUrl,
        user.firstName ?? undefined,
      );
      await this.audit.log({
        tenantId: tenant.id,
        actorId: user.id,
        action: AuditAction.OTHER,
        entityType: 'user',
        entityId: user.id,
        ipAddress: req.ip,
        metadata: { event: 'forgot_password' },
      });

      const isProduction = this.config.get('NODE_ENV') === 'production';
      // Without SMTP, email stays PENDING — expose the link locally so reset is usable.
      if (isProduction || notification.status !== NotificationStatus.PENDING) {
        resetUrl = undefined;
      } else {
        this.logger.warn(`Password reset email not delivered (SMTP off). Dev link: ${resetUrl}`);
      }
    }

    return {
      message: "Check your inbox for a reset link. If you don't see it, look in spam — the link expires in 1 hour.",
      ...(resetUrl
        ? {
            resetUrl,
            emailDelivery: 'pending_smtp' as const,
          }
        : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto, req: Request) {
    const tokenHash = hashToken(dto.token);
    const record = await this.prisma.authToken.findFirst({
      where: {
        tokenHash,
        type: AuthTokenType.PASSWORD_RESET,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!record) {
      throw new BadRequestException('Reset token is invalid or expired');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
      }),
      this.prisma.authToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.refreshSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.audit.log({
      tenantId: record.user.tenantId,
      actorId: record.userId,
      action: AuditAction.UPDATE,
      entityType: 'user',
      entityId: record.userId,
      ipAddress: req.ip,
      metadata: { event: 'password_reset' },
    });

    return { message: 'Password has been reset. Please sign in.' };
  }

  async verifyEmail(token: string, req: Request) {
    const result = await this.consumeEmailVerificationToken(token, req);
    if (!result.verified) {
      throw new BadRequestException(result.message);
    }
    return { verified: true, message: result.message };
  }

  async verifyEmailQuery(token: string | undefined, req: Request) {
    if (!token?.trim()) {
      return {
        verified: false,
        message: 'Verification link is missing a token. Request a new email from your account.',
      };
    }
    return this.consumeEmailVerificationToken(token.trim(), req);
  }

  async sendVerificationEmail(user: AuthUser) {
    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.dispatchVerificationEmail(
      user.userId,
      user.email,
      user.tenantId,
      user.firstName,
    );

    return {
      message:
        'Verification email sent. Check your inbox and use the link to confirm your address.',
    };
  }

  /** @deprecated Use sendVerificationEmail — kept for existing clients */
  async resendVerification(user: AuthUser) {
    return this.sendVerificationEmail(user);
  }

  private generateReferralCode(): string {
    const bytes = randomBytes(5);
    let digits = '';
    for (let i = 0; i < 5; i++) {
      digits += (bytes[i]! % 10).toString();
    }
    return `CAL${digits}`;
  }

  private isReferralCodeCollision(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    );
  }

  private async dispatchVerificationEmail(
    userId: string,
    email: string,
    tenantId: string,
    firstName?: string | null,
  ) {
    this.logger.log(
      `[auth] dispatchVerificationEmail userId=${userId} email=${email} → NotificationsService.sendVerificationEmail`,
    );
    const verifyToken = await this.createAuthToken(userId, AuthTokenType.EMAIL_VERIFICATION);
    const webUrl = this.config.get('WEB_URL', 'http://localhost:3000');
    const verifyUrl = `${webUrl}/verify-email?token=${encodeURIComponent(verifyToken)}`;
    await this.notifications.sendVerificationEmail(
      tenantId,
      userId,
      email,
      verifyUrl,
      firstName ?? undefined,
    );
  }

  private async consumeEmailVerificationToken(token: string, req: Request) {
    const tokenHash = hashToken(token);
    const record = await this.prisma.authToken.findFirst({
      where: {
        tokenHash,
        type: AuthTokenType.EMAIL_VERIFICATION,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!record) {
      return {
        verified: false as const,
        message:
          'This verification link is invalid or has expired. Sign in and resend a new verification email.',
      };
    }

    if (record.user.emailVerifiedAt) {
      await this.prisma.authToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      });
      return {
        verified: true as const,
        message: 'Your email address is already verified.',
      };
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date(), status: UserStatus.ACTIVE },
      }),
      this.prisma.authToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    await this.audit.log({
      tenantId: record.user.tenantId,
      actorId: record.userId,
      action: AuditAction.UPDATE,
      entityType: 'user',
      entityId: record.userId,
      ipAddress: req.ip,
      metadata: { event: 'email_verified' },
    });

    return {
      verified: true as const,
      message: 'Your email address has been verified successfully.',
    };
  }

  private async issueSession(
    userId: string,
    req: Request,
    res: Response,
  ): Promise<SessionResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    const roles = asRoleSlugs(user.userRoles.map((ur) => ur.role.slug));
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: resolveJwtAccessSecret(this.config),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = generateSecureToken(48);
    const refreshExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date(Date.now() + this.parseRefreshExpiry(refreshExpiresIn));

    await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    // Access and CSRF first; refresh last so it survives proxies that drop the
    // middle Set-Cookie header when forwarding upstream auth responses.
    this.cookies.setAccessCookie(res, accessToken);
    const csrfToken = this.cookies.issueCsrfToken(res);
    this.cookies.setRefreshCookie(res, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        emailVerified: Boolean(user.emailVerifiedAt),
      },
      csrfToken,
    };
  }

  private parseRefreshExpiry(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) return 7 * 24 * 60 * 60 * 1000;
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

  private async createAuthToken(userId: string, type: AuthTokenType) {
    const raw = generateSecureToken(32);
    const hours = type === AuthTokenType.PASSWORD_RESET ? 1 : 24;

    if (type === AuthTokenType.EMAIL_VERIFICATION) {
      await this.prisma.authToken.updateMany({
        where: {
          userId,
          type: AuthTokenType.EMAIL_VERIFICATION,
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });
    }

    await this.prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
      },
    });

    return raw;
  }

  private async revokeRefreshToken(rawToken: string) {
    await this.prisma.refreshSession.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeRefreshSession(sessionId: string) {
    await this.prisma.refreshSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  private async assertLoginNotThrottled(email: string, ip?: string) {
    const since = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000);
    const attempts = await this.prisma.authLoginAttempt.count({
      where: {
        createdAt: { gte: since },
        OR: [{ email }, ...(ip ? [{ ipAddress: ip }] : [])],
      },
    });

    if (attempts >= MAX_LOGIN_ATTEMPTS_PER_WINDOW) {
      throw new UnauthorizedException('Too many login attempts. Try again later.');
    }
  }

  private async recordLoginAttempt(
    email: string,
    tenantId: string,
    ip: string | undefined,
    success: boolean,
  ) {
    await this.prisma.authLoginAttempt.create({
      data: { email, tenantId, ipAddress: ip, success },
    });
  }

  private async handleFailedLogin(
    userId: string,
    email: string,
    tenantId: string,
    req: Request,
  ) {
    await this.recordLoginAttempt(email, tenantId, req.ip, false);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: { increment: 1 } },
    });

    if (user.failedLoginCount >= MAX_FAILED_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000),
        },
      });
      this.logger.warn(`Account locked for user ${userId}`);
    }
  }
}
