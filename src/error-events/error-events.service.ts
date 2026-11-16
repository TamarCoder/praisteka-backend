import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UserView } from '../auth/auth.service.js';
import type { ReportErrorDto } from './dto/report-error.dto.js';
import { ErrorEvent, type ErrorAction } from './entities/error-event.entity.js';

export interface ErrorFilter {
  action?: ErrorAction;
  userId?: string;
  limit: number;
}

@Injectable()
export class ErrorEventsService {
  constructor(@InjectRepository(ErrorEvent) private readonly events: Repository<ErrorEvent>) {}

  // A signed-in user's id and email win over whatever the body says.
  async report(dto: ReportErrorDto, user?: UserView): Promise<void> {
    await this.events.save(
      this.events.create({
        userId: user?.id ?? null,
        email: user?.email ?? dto.email ?? '',
        action: dto.action,
        code: dto.code,
        message: dto.message,
      }),
    );
  }

  find({ action, userId, limit }: ErrorFilter): Promise<ErrorEvent[]> {
    return this.events.find({
      where: { ...(action && { action }), ...(userId && { userId }) },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
