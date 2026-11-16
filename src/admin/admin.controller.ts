import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ErrorEventsService } from '../error-events/error-events.service.js';
import { AdminGuard } from './admin.guard.js';
import { AdminService } from './admin.service.js';
import { ListErrorsQuery } from './dto/list-errors.query.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

@Controller('api/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly errors: ErrorEventsService,
  ) {}

  @Get('stats')
  getStats() {
    return this.admin.getStats();
  }

  @Get('system')
  getSystemStatus() {
    return this.admin.getSystemStatus();
  }

  @Get('users')
  listUsers() {
    return this.admin.listUsers();
  }

  @Get('users/:id')
  getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.getUser(id);
  }

  @Patch('users/:id/status')
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserStatusDto) {
    return this.admin.setStatus(id, dto.status);
  }

  @Get('errors')
  listErrors(@Query() query: ListErrorsQuery) {
    return this.errors.find(query);
  }
}
