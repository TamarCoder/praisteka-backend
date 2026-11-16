import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { User } from '../users/entities/user.entity.js';
import type { Session } from './entities/session.entity.js';
import { AuthService } from './auth.service.js';
import { hashPassword } from './password.js';

describe('AuthService', () => {
  let users: Record<string, ReturnType<typeof vi.fn>>;
  let sessions: Record<string, ReturnType<typeof vi.fn>>;
  let service: AuthService;

  async function account(overrides: Partial<User> = {}) {
    return { id: 'u-1', name: 'Nino', email: 'nino@clinic.ge', role: 'user', status: 'active', passwordHash: await hashPassword('correct-pass'), ...overrides };
  }

  beforeEach(() => {
    users = { findOne: vi.fn(), update: vi.fn().mockResolvedValue(undefined) };
    sessions = {
      delete: vi.fn().mockResolvedValue(undefined),
      create: vi.fn((value: unknown) => value),
      save: vi.fn().mockResolvedValue(undefined),
    };
    service = new AuthService(users as unknown as Repository<User>, sessions as unknown as Repository<Session>);
  });

  it('signs in an active user and never returns the password hash', async () => {
    users.findOne.mockResolvedValue(await account());
    const result = await service.login({ email: 'nino@clinic.ge', password: 'correct-pass' });
    expect(result.token).toEqual(expect.any(String));
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(sessions.save).toHaveBeenCalledOnce();
  });

  it('rejects a blocked user with the right password', async () => {
    users.findOne.mockResolvedValue(await account({ status: 'blocked' }));
    await expect(service.login({ email: 'nino@clinic.ge', password: 'correct-pass' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(sessions.save).not.toHaveBeenCalled();
  });

  it('rejects a wrong password and an unknown email the same way', async () => {
    users.findOne.mockResolvedValue(await account());
    await expect(service.login({ email: 'nino@clinic.ge', password: 'wrong-pass' })).rejects.toBeInstanceOf(UnauthorizedException);
    users.findOne.mockResolvedValue(null);
    await expect(service.login({ email: 'nobody@clinic.ge', password: 'correct-pass' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('admin login rejects a regular user with the right password', async () => {
    users.findOne.mockResolvedValue(await account());
    await expect(service.adminLogin({ email: 'nino@clinic.ge', password: 'correct-pass' })).rejects.toBeInstanceOf(UnauthorizedException);
    users.findOne.mockResolvedValue(await account({ role: 'admin' }));
    const result = await service.adminLogin({ email: 'nino@clinic.ge', password: 'correct-pass' });
    expect(result.user.role).toBe('admin');
  });
});
