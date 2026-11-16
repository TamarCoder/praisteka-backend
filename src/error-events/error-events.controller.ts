import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { UserView } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Public } from '../auth/public.decorator.js';
import { ReportErrorDto } from './dto/report-error.dto.js';
import { ErrorEventsService } from './error-events.service.js';

// Public: register and login errors happen before there is a session. Rate limited.
@Controller('api/errors')
export class ErrorEventsController {
  constructor(private readonly events: ErrorEventsService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post()
  @HttpCode(204)
  report(@Body() dto: ReportErrorDto, @CurrentUser() user?: UserView) {
    return this.events.report(dto, user);
  }
}
