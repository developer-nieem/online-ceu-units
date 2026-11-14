import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { AUTH_COOKIE, AUTH_HEADER } from '../../config/auth.constants';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const cookieToken = request.cookies?.[AUTH_COOKIE.CSRF] as string | undefined;
    const headerToken = this.readHeaderToken(request);
    const clientHeader = this.readClientHeader(request);

    const isDev = this.config.get('NODE_ENV') !== 'production';

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      if (isDev) {
        this.logger.warn(
          `CSRF mismatch ${request.method} ${request.url} — cookie=${Boolean(cookieToken)} header=${Boolean(headerToken)} match=${cookieToken === headerToken}`,
        );
      }
      throw new ForbiddenException('Invalid CSRF token');
    }

    if (clientHeader !== 'web') {
      if (isDev) {
        this.logger.warn(`Invalid client header: ${String(clientHeader)}`);
      }
      throw new ForbiddenException('Invalid client header');
    }

    return true;
  }

  private readHeaderToken(request: Request): string | undefined {
    const raw = request.headers[AUTH_HEADER.CSRF];
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw)) return raw[0];
    return request.get?.(AUTH_HEADER.CSRF) ?? undefined;
  }

  private readClientHeader(request: Request): string | undefined {
    const raw = request.headers[AUTH_HEADER.CLIENT];
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw)) return raw[0];
    return request.get?.(AUTH_HEADER.CLIENT) ?? undefined;
  }
}
