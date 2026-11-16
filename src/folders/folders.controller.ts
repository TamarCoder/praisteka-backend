import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { UserView } from '../auth/auth.service.js';
import { CreateFolderDto } from './dto/create-folder.dto.js';
import { FoldersService } from './folders.service.js';

@Controller('api/folders')
export class FoldersController {
  constructor(private readonly folders: FoldersService) {}

  @Get()
  findAll(@CurrentUser() user: UserView) {
    return this.folders.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: UserView, @Body() dto: CreateFolderDto) {
    return this.folders.create(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: UserView, @Param('id', ParseUUIDPipe) id: string) {
    return this.folders.remove(user.id, id);
  }
}
