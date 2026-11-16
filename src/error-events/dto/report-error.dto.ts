import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ERROR_ACTIONS, type ErrorAction } from '../entities/error-event.entity.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class ReportErrorDto {
  @IsIn(ERROR_ACTIONS)
  action!: ErrorAction;

  // e.g. FILE_TOO_LARGE
  @Matches(/^[A-Z0-9_]{2,64}$/u)
  code!: string;

  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  message!: string;

  // Only used when no session is attached (failed register / login).
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  @MaxLength(254)
  email?: string;
}
