import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

// Counts login attempts per email + IP, so one attacker cannot guess a password
// and one busy office IP does not lock out other users.
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(request: Request): Promise<string> {
    const raw = (request.body as { email?: unknown } | undefined)?.email;
    const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
    return Promise.resolve(`${email}|${request.ip ?? ''}`);
  }
}
