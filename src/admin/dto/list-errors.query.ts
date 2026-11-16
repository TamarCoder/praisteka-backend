import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ERROR_ACTIONS, type ErrorAction } from '../../error-events/entities/error-event.entity.js';

export class ListErrorsQuery {
  @IsOptional()
  @IsIn(ERROR_ACTIONS)
  action?: ErrorAction;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit = 100;
}
