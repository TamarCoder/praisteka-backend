import { IsIn } from 'class-validator';
import type { UserStatus } from '../../users/entities/user.entity.js';

export class UpdateUserStatusDto {
  @IsIn(['active', 'pending', 'blocked'])
  status!: UserStatus;
}
