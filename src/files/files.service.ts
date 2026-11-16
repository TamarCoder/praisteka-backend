import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity.js';
import { Folder } from '../folders/entities/folder.entity.js';
import { FoldersService } from '../folders/folders.service.js';
import type { CreateFileDto } from './dto/create-file.dto.js';
import type { UpdateFileDto } from './dto/update-file.dto.js';
import { Snapshot } from './entities/snapshot.entity.js';
import { UserFile } from './entities/user-file.entity.js';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(UserFile) private readonly files: Repository<UserFile>,
    @InjectRepository(Snapshot) private readonly snapshots: Repository<Snapshot>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    private readonly folders: FoldersService,
    private readonly dataSource: DataSource,
  ) {}

  // List without sheet contents.
  findAll(userId: string): Promise<UserFile[]> {
    return this.files.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  async findOne(userId: string, id: string): Promise<UserFile> {
    const file = await this.files.findOne({
      where: { id, userId },
      select: { id: true, userId: true, companyId: true, folderId: true, fileName: true, effectiveFrom: true, sheets: true, createdAt: true, updatedAt: true },
    });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async create(userId: string, dto: CreateFileDto): Promise<UserFile> {
    if (dto.folderId) await this.folders.findOwn(userId, dto.folderId);
    const company = await this.findOrCreateCompany(userId, dto.companyName);
    const saved = await this.files.save(
      this.files.create({
        userId,
        companyId: company.id,
        folderId: dto.folderId ?? null,
        fileName: dto.fileName,
        effectiveFrom: dto.effectiveFrom,
        sheets: dto.sheets,
      }),
    );
    return this.findOne(userId, saved.id);
  }

  async update(userId: string, id: string, dto: UpdateFileDto): Promise<UserFile> {
    const file = await this.findOne(userId, id);
    if (dto.folderId) await this.folders.findOwn(userId, dto.folderId);
    if (dto.sheets !== undefined) file.sheets = dto.sheets;
    if (dto.folderId !== undefined) file.folderId = dto.folderId;
    await this.files.save(file);
    return this.findOne(userId, id);
  }

  // The company is removed too when it has no other files.
  async remove(userId: string, id: string): Promise<void> {
    const file = await this.findOne(userId, id);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(UserFile, { id, userId });
      const left = await manager.count(UserFile, { where: { companyId: file.companyId } });
      if (left === 0) await manager.delete(Company, { id: file.companyId, userId });
    });
  }

  // Settings → "clear data": every file, folder and company of this user.
  async removeAll(userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(UserFile, { userId });
      await manager.delete(Folder, { userId });
      await manager.delete(Company, { userId });
    });
  }

  async listSnapshots(userId: string, fileId: string): Promise<Snapshot[]> {
    await this.findOne(userId, fileId);
    return this.snapshots.find({ where: { fileId }, order: { n: 'ASC' } });
  }

  async findSnapshot(userId: string, fileId: string, id: string): Promise<Snapshot> {
    await this.findOne(userId, fileId);
    const snapshot = await this.snapshots.findOne({
      where: { id, fileId },
      select: { id: true, fileId: true, n: true, note: true, sheets: true, savedAt: true },
    });
    if (!snapshot) throw new NotFoundException('Version not found');
    return snapshot;
  }

  // Copies the file's current sheets. Two saves at once: the (file_id, n) unique index answers 409.
  async createSnapshot(userId: string, fileId: string, note = ''): Promise<Snapshot> {
    const file = await this.findOne(userId, fileId);
    const last = await this.snapshots.maximum('n', { fileId });
    const saved = await this.snapshots.save(
      this.snapshots.create({ fileId, n: (last ?? 0) + 1, note, sheets: file.sheets }),
    );
    return this.findSnapshot(userId, fileId, saved.id);
  }

  private async findOrCreateCompany(userId: string, rawName: string): Promise<Company> {
    const name = rawName.trim();
    const existing = await this.companies
      .createQueryBuilder('c')
      .where('c.user_id = :userId AND lower(c.name) = lower(:name)', { userId, name })
      .getOne();
    return existing ?? this.companies.save(this.companies.create({ userId, name }));
  }
}
