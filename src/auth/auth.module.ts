import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { Session } from './entities/session.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session]),
    // Per 15 minutes: 5 attempts per email+IP, and 30 per IP across all emails.
    // Counters live in memory and reset on restart.
    ThrottlerModule.forRoot([
      { name: 'login', ttl: 15 * 60_000, limit: 5 },
      {
        name: 'loginIp',
        ttl: 15 * 60_000,
        limit: 30,
        getTracker: (request: Record<string, unknown>) => (typeof request.ip === 'string' ? request.ip : ''),
      },
    ]),
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
