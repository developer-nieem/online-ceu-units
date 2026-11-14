import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@calace/db';

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL is missing. In Railway → Variables, set DATABASE_URL to your Neon pooled URL (host contains neon.tech, not localhost).',
    );
  }
  if (
    (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) &&
    /localhost|127\.0\.0\.1/i.test(url)
  ) {
    throw new Error(
      'DATABASE_URL points to localhost. Railway has no local Postgres — paste your Neon pooled URL from console.neon.tech (or your local .env Neon line).',
    );
  }
  return url;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = resolveDatabaseUrl();
    super({
      datasources: {
        db: { url },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      const host = new URL(process.env.DATABASE_URL!).hostname;
      this.logger.log(`Prisma connected to database host=${host}`);
    } catch (err) {
      this.logger.error(
        'Prisma $connect failed — set Railway Variables DATABASE_URL + DIRECT_URL to Neon (use ?sslmode=require; omit channel_binding=require)',
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
