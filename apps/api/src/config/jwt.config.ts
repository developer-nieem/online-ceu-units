import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';

/** Dev-only fallback — never used when NODE_ENV=production */
const DEV_JWT_ACCESS_SECRET =
  'calace-dev-jwt-access-secret-min-32-characters-long';

const PLACEHOLDER_SECRETS = new Set([
  '',
  'change-me-to-a-32-char-minimum-secret-key',
]);

let devSecretWarningLogged = false;

export function resolveJwtAccessSecret(config: ConfigService): string {
  const configured = config.get<string>('JWT_ACCESS_SECRET')?.trim();
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  if (configured && !PLACEHOLDER_SECRETS.has(configured)) {
    return configured;
  }

  if (nodeEnv === 'production') {
    throw new Error(
      'JWT_ACCESS_SECRET is required in production. Set a strong secret in your environment.',
    );
  }

  if (!devSecretWarningLogged) {
    Logger.warn(
      'JWT_ACCESS_SECRET is unset or still a placeholder — using a development-only default. Set JWT_ACCESS_SECRET in .env before deploying.',
      'JwtConfig',
    );
    devSecretWarningLogged = true;
  }

  return DEV_JWT_ACCESS_SECRET;
}

export function createJwtModuleOptions(config: ConfigService): JwtModuleOptions {
  return {
    secret: resolveJwtAccessSecret(config),
    signOptions: {
      expiresIn: config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    },
  };
}
