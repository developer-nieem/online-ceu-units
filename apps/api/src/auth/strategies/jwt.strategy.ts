import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { asRoleSlugs, AUTH_COOKIE } from '../../config/auth.constants';
import { resolveJwtAccessSecret } from '../../config/jwt.config';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser, JwtPayload } from '../types/auth-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const fromCookie = request?.cookies?.[AUTH_COOKIE.ACCESS] as string | undefined;
          const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
          return fromCookie ?? fromHeader ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: resolveJwtAccessSecret(config),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        tenantId: payload.tenantId,
        deletedAt: null,
        status: 'ACTIVE',
      },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Session is invalid');
    }

    return {
      sub: user.id,
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: asRoleSlugs(user.userRoles.map((ur) => ur.role.slug)),
      emailVerified: Boolean(user.emailVerifiedAt),
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
