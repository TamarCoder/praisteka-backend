import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { Session } from '../auth/entities/session.entity.js';
import { ErrorEvent } from '../error-events/entities/error-event.entity.js';
import { UserFile } from '../files/entities/user-file.entity.js';
import { Folder } from '../folders/entities/folder.entity.js';
import { User, type UserRole, type UserStatus } from '../users/entities/user.entity.js';

// A user counts as online when seen within this window.
export const ONLINE_WINDOW_MS = 5 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

export type Presence = 'online' | 'offline';

export interface AdminUserView {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  presence: Presence;
  files: number;
  folders: number;
  errors: number;
  registeredAt: Date;
  lastSeenAt: Date | null;
}

export interface AdminStats {
  users: number;
  online: number;
  blocked: number;
  files: number;
  errors24h: number;
}

export interface AdminSystemStatus {
  api: 'ok';
  database: { status: 'ok' | 'down'; latencyMs: number | null };
  uptimeSeconds: number;
  memoryMb: { rss: number; heapUsed: number };
  activeSessions: number;
  node: string;
  checkedAt: string;
}

type CountRow = { userId: string; count: string };

export function presenceOf(lastSeenAt: Date | null, now = Date.now()): Presence {
  return lastSeenAt && now - lastSeenAt.getTime() <= ONLINE_WINDOW_MS ? 'online' : 'offline';
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserFile) private readonly files: Repository<UserFile>,
    @InjectRepository(Folder) private readonly folders: Repository<Folder>,
    @InjectRepository(ErrorEvent) private readonly errors: Repository<ErrorEvent>,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    private readonly dataSource: DataSource,
  ) {}

  async getStats(): Promise<AdminStats> {
    const now = Date.now();
    const [users, online, blocked, files, errors24h] = await Promise.all([
      this.users.count({ where: { role: 'user' } }),
      this.users.count({ where: { role: 'user', lastSeenAt: MoreThan(new Date(now - ONLINE_WINDOW_MS)) } }),
      this.users.count({ where: { role: 'user', status: 'blocked' } }),
      this.files.count(),
      this.errors.count({ where: { createdAt: MoreThan(new Date(now - DAY_MS)) } }),
    ]);
    return { users, online, blocked, files, errors24h };
  }

  async getSystemStatus(): Promise<AdminSystemStatus> {
    const started = performance.now();
    let database: AdminSystemStatus['database'];
    try {
      await this.dataSource.query('SELECT 1');
      database = { status: 'ok', latencyMs: Math.round(performance.now() - started) };
    } catch {
      database = { status: 'down', latencyMs: null };
    }
    const activeSessions = database.status === 'ok' ? await this.sessions.count({ where: { expiresAt: MoreThan(new Date()) } }) : 0;
    const memory = process.memoryUsage();
    const toMb = (bytes: number) => Math.round(bytes / 1024 / 1024);
    return {
      api: 'ok',
      database,
      uptimeSeconds: Math.round(process.uptime()),
      memoryMb: { rss: toMb(memory.rss), heapUsed: toMb(memory.heapUsed) },
      activeSessions,
      node: process.version,
      checkedAt: new Date().toISOString(),
    };
  }

  async listUsers(): Promise<AdminUserView[]> {
    const [users, files, folders, errors] = await Promise.all([
      this.users.find({ where: { role: 'user' }, order: { createdAt: 'DESC' } }),
      this.countBy(this.files, 'files'),
      this.countBy(this.folders, 'folders'),
      this.countBy(this.errors, 'error_events'),
    ]);
    const now = Date.now();
    return users.map((u) => this.toView(u, files, folders, errors, now));
  }

  async getUser(id: string): Promise<AdminUserView> {
    const user = await this.users.findOneBy({ id, role: 'user' });
    if (!user) throw new NotFoundException('User not found');
    const [files, folders, errors] = await Promise.all([
      this.files.count({ where: { userId: id } }),
      this.folders.count({ where: { userId: id } }),
      this.errors.count({ where: { userId: id } }),
    ]);
    const one = (count: number) => new Map([[id, count]]);
    return this.toView(user, one(files), one(folders), one(errors), Date.now());
  }

  // Blocking also ends every session of that user.
  async setStatus(id: string, status: UserStatus): Promise<AdminUserView> {
    await this.getUser(id);
    await this.users.update(id, { status });
    if (status === 'blocked') await this.sessions.delete({ userId: id });
    return this.getUser(id);
  }

  private async countBy(repo: Repository<UserFile | Folder | ErrorEvent>, table: string): Promise<Map<string, number>> {
    const rows = await repo
      .createQueryBuilder(table)
      .select(`${table}.user_id`, 'userId')
      .addSelect('COUNT(*)', 'count')
      .where(`${table}.user_id IS NOT NULL`)
      .groupBy(`${table}.user_id`)
      .getRawMany<CountRow>();
    return new Map(rows.map((r) => [r.userId, Number(r.count)]));
  }

  private toView(u: User, files: Map<string, number>, folders: Map<string, number>, errors: Map<string, number>, now: number): AdminUserView {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      presence: presenceOf(u.lastSeenAt, now),
      files: files.get(u.id) ?? 0,
      folders: folders.get(u.id) ?? 0,
      errors: errors.get(u.id) ?? 0,
      registeredAt: u.createdAt,
      lastSeenAt: u.lastSeenAt,
    };
  }
}
