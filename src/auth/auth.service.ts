import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { LessThan, Repository } from 'typeorm';
import { User, type UserRole, type UserStatus } from '../users/entities/user.entity.js';
import { Session } from './entities/session.entity.js';
import { hashPassword, verifyPassword } from './password.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

export const SESSION_TTL_DAYS = 30;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
// last_seen_at is written at most once per minute per user.
const SEEN_WRITE_MS = 60_000;

export interface UserView {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function toView(user: User): UserView {
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt };
}

const LOGIN_SELECT = { id: true, name: true, email: true, role: true, status: true, createdAt: true, passwordHash: true } as const;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
  ) {}

  async register(dto: RegisterDto): Promise<UserView> {
    if (await this.users.exists({ where: { email: dto.email } }))
      throw new ConflictException('Email already registered');
    const user = await this.users.save(
      this.users.create({ name: dto.name, email: dto.email, passwordHash: await hashPassword(dto.password) }),
    );
    return toView(user);
  }

  async login(dto: LoginDto) {
    const user = await this.verify(dto);
    if (user.status === 'blocked') throw new ForbiddenException('Account blocked');
    return this.startSession(user);
  }

  // Same answer for a wrong password and a non-admin account, so admins cannot be discovered.
  async adminLogin(dto: LoginDto) {
    const user = await this.verify(dto);
    if (user.role !== 'admin' || user.status === 'blocked') throw new UnauthorizedException('Invalid credentials');
    return this.startSession(user);
  }

  private async verify(dto: LoginDto): Promise<User> {
    const user = await this.users.findOne({ where: { email: dto.email }, select: LOGIN_SELECT });
    const valid = await verifyPassword(dto.password, user?.passwordHash ?? '');
    if (!user || !valid) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  private async startSession(user: User) {
    // Clears every expired session, not only this user's.
    await this.sessions.delete({ expiresAt: LessThan(new Date()) });
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.sessions.save(this.sessions.create({ tokenHash: hashToken(token), userId: user.id, expiresAt }));
    await this.users.update(user.id, { lastSeenAt: new Date() });
    return { token, expiresAt: expiresAt.toISOString(), user: toView(user) };
  }

  async logout(token: string): Promise<void> {
    await this.sessions.delete({ tokenHash: hashToken(token) });
  }

  // Returns null for an unknown, expired or blocked session. Also marks the user as seen.
  async findUserByToken(token: string): Promise<UserView | null> {
    const session = await this.sessions.findOne({ where: { tokenHash: hashToken(token) }, relations: { user: true } });
    const user = session?.user;
    if (!user || session.expiresAt.getTime() <= Date.now() || user.status === 'blocked') return null;
    if (!user.lastSeenAt || Date.now() - user.lastSeenAt.getTime() > SEEN_WRITE_MS)
      await this.users.update(user.id, { lastSeenAt: new Date() });
    return toView(user);
  }

  // A taken email is rejected by the unique index → 409 (UniqueViolationFilter).
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserView> {
    await this.users.update(userId, { name: dto.name, email: dto.email });
    return toView(await this.users.findOneByOrFail({ id: userId }));
  }

  // Other sessions are ended; the current one stays.
  async changePassword(userId: string, dto: ChangePasswordDto, currentToken: string): Promise<void> {
    const user = await this.users.findOneOrFail({ where: { id: userId }, select: LOGIN_SELECT });
    // 400, not 401: a 401 would end the client's session.
    if (!(await verifyPassword(dto.currentPassword, user.passwordHash)))
      throw new BadRequestException('Wrong current password');
    await this.users.update(userId, { passwordHash: await hashPassword(dto.newPassword) });
    await this.sessions
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId AND token_hash <> :keep', { userId, keep: hashToken(currentToken) })
      .execute();
  }

  // Files, folders, companies, snapshots and sessions go with it (ON DELETE CASCADE).
  async deleteAccount(userId: string): Promise<void> {
    await this.users.delete(userId);
  }
}
