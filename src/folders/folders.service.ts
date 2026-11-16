import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateFolderDto } from './dto/create-folder.dto.js';
import { Folder } from './entities/folder.entity.js';

@Injectable()
export class FoldersService {
  constructor(@InjectRepository(Folder) private readonly folders: Repository<Folder>) {}

  findAll(userId: string): Promise<Folder[]> {
    return this.folders.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  // A duplicate name is rejected by the unique index → 409 (UniqueViolationFilter).
  create(userId: string, dto: CreateFolderDto): Promise<Folder> {
    return this.folders.save(this.folders.create({ userId, name: dto.name }));
  }

  async findOwn(userId: string, id: string): Promise<Folder> {
    const folder = await this.folders.findOneBy({ id, userId });
    if (!folder) throw new NotFoundException('Folder not found');
    return folder;
  }

  // Files inside stay; their folder_id becomes NULL (ON DELETE SET NULL).
  async remove(userId: string, id: string): Promise<void> {
    await this.folders.remove(await this.findOwn(userId, id));
  }
}
