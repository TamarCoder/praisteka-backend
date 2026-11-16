import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorEvent } from './entities/error-event.entity.js';
import { ErrorEventsController } from './error-events.controller.js';
import { ErrorEventsService } from './error-events.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ErrorEvent])],
  controllers: [ErrorEventsController],
  providers: [ErrorEventsService],
  exports: [ErrorEventsService],
})
export class ErrorEventsModule {}
