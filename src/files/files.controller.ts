import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { UserView } from '../auth/auth.service.js';
import { CreateFileDto } from './dto/create-file.dto.js';
import { CreateSnapshotDto } from './dto/create-snapshot.dto.js';
import { UpdateFileDto } from './dto/update-file.dto.js';
import { FilesService } from './files.service.js';

@Controller('api/files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get()
  findAll(@CurrentUser() user: UserView) {
    return this.files.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: UserView, @Body() dto: CreateFileDto) {
    return this.files.create(user.id, dto);
  }

  @Delete()
  @HttpCode(204)
  removeAll(@CurrentUser() user: UserView) {
    return this.files.removeAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: UserView, @Param('id', ParseUUIDPipe) id: string) {
    return this.files.findOne(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: UserView, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFileDto) {
    return this.files.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: UserView, @Param('id', ParseUUIDPipe) id: string) {
    return this.files.remove(user.id, id);
  }

  @Get(':id/snapshots')
  listSnapshots(@CurrentUser() user: UserView, @Param('id', ParseUUIDPipe) id: string) {
    return this.files.listSnapshots(user.id, id);
  }

  @Post(':id/snapshots')
  createSnapshot(@CurrentUser() user: UserView, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateSnapshotDto) {
    return this.files.createSnapshot(user.id, id, dto.note);
  }

  @Get(':id/snapshots/:snapshotId')
  findSnapshot(
    @CurrentUser() user: UserView,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('snapshotId', ParseUUIDPipe) snapshotId: string,
  ) {
    return this.files.findSnapshot(user.id, id, snapshotId);
  }
}
