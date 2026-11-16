import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { UniqueViolationFilter } from './database/unique-violation.filter.js';

// 3000 = priceteka (main app), 3001 = priceteka-admin.
const DEFAULT_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'];
// Parsed Excel workbooks travel as JSON; the default 100 KB is too small.
const JSON_LIMIT = '10mb';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.useBodyParser('json', { limit: JSON_LIMIT });

  // Behind a proxy, the real client IP is needed for the login limit.
  const rawTrustProxy = process.env.TRUST_PROXY?.trim().toLowerCase() ?? '';
  const trustProxy = rawTrustProxy === 'true' ? 1 : Number(rawTrustProxy || 0);
  if (trustProxy > 0) app.set('trust proxy', trustProxy);

  app.useGlobalFilters(new UniqueViolationFilter(app.get(HttpAdapterHost).httpAdapter));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const origins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : DEFAULT_ORIGINS;
  app.enableCors({ origin: origins, credentials: true });
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
