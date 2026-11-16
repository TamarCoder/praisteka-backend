import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService, type UserView } from './auth.service.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

export interface AuthedRequest extends Request {
  user?: UserView;
  sessionToken?: string;
}

export function readBearer(request: Request): string | null {
  const header = request.header('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

// Every non-public route needs "Authorization: Bearer <session token>".
// On public routes a valid token is still attached, so they can know the caller.
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = readBearer(request);
    const user = token ? await this.auth.findUserByToken(token) : null;

    if (user && token) {
      request.user = user;
      request.sessionToken = token;
    }
    if (isPublic) return true;
    if (!user) throw new UnauthorizedException('Session expired');
    return true;
  }
}
