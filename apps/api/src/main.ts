import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  // Railway/Render set PORT; local/dev can use API_PORT
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  const corsOrigin = process.env.API_CORS_ORIGIN ?? 'http://localhost:3000';

  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = new Set(
    [
      corsOrigin,
      process.env.WEB_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ].filter((value): value is string => Boolean(value)),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-calace-client'],
    exposedHeaders: ['Set-Cookie'],
  });
  app.setGlobalPrefix('api');

  // Railway/Metal healthchecks reach the container from outside localhost —
  // must bind 0.0.0.0 or /api/health never responds.
  await app.listen(port, '0.0.0.0');
  logger.log(`API listening on 0.0.0.0:${port}/api`);
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'API failed to start',
    err instanceof Error ? err.stack : String(err),
  );
  process.exit(1);
});
