import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from './session.guard.js';

// The user that SessionGuard attached to the request.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<AuthedRequest>().user,
);
