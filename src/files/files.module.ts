import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity.js';
import { FoldersModule } from '../folders/folders.module.js';
import { Snapshot } from './entities/snapshot.entity.js';
import { UserFile } from './entities/user-file.entity.js';
import { FilesController } from './files.controller.js';
import { FilesService } from './files.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserFile, Snapshot, Company]), FoldersModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
