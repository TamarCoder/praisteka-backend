import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './admin.guard.js';

function contextWith(user: unknown): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => ({ user }) }) } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('lets an admin through', () => {
    expect(guard.canActivate(contextWith({ role: 'admin' }))).toBe(true);
  });

  it('blocks a regular user and a missing user', () => {
    expect(() => guard.canActivate(contextWith({ role: 'user' }))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contextWith(undefined))).toThrow(ForbiddenException);
  });
});
