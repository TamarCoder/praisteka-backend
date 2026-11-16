import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsISO8601, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateFileDto {
  // Created on the fly when this user has no company with this name yet.
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  companyName!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  // "YYYY-MM-DD"
  @IsISO8601({ strict: true })
  effectiveFrom!: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  // Parsed workbook from the frontend (readWorkbook). Not validated cell by cell.
  @IsArray()
  @ArrayMaxSize(100)
  sheets!: Record<string, unknown>[];
}
