import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { SessionGuard } from './auth/session.guard.js';
import { CompaniesModule } from './companies/companies.module.js';
import { ErrorEventsModule } from './error-events/error-events.module.js';
import { FilesModule } from './files/files.module.js';
import { FoldersModule } from './folders/folders.module.js';
import { HealthController } from './health/health.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.getOrThrow<string>('DB_PORT')),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_DATABASE'),
        ssl: config.get<string>('DB_SSL') === 'true',
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    AuthModule,
    FoldersModule,
    CompaniesModule,
    FilesModule,
    ErrorEventsModule,
    AdminModule,
  ],
  controllers: [HealthController],
  // Every route needs a login session unless marked @Public().
  providers: [{ provide: APP_GUARD, useClass: SessionGuard }],
})
export class AppModule {}
