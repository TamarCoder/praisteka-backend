import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../auth/entities/session.entity.js';
import { ErrorEvent } from '../error-events/entities/error-event.entity.js';
import { ErrorEventsModule } from '../error-events/error-events.module.js';
import { UserFile } from '../files/entities/user-file.entity.js';
import { Folder } from '../folders/entities/folder.entity.js';
import { User } from '../users/entities/user.entity.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserFile, Folder, ErrorEvent, Session]), ErrorEventsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
