import { ArrayMaxSize, IsArray, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class UpdateFileDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  sheets?: Record<string, unknown>[];

  // null moves the file out of its folder.
  @ValidateIf((_dto, value) => value !== null && value !== undefined)
  @IsUUID()
  folderId?: string | null;
}
