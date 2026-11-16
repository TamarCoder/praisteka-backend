import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// One uploaded Excel file. `sheets` is the parsed workbook the frontend already reads.
@Entity('files')
export class UserFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'folder_id', type: 'uuid', nullable: true })
  folderId!: string | null;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  // "YYYY-MM-DD"
  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({ type: 'jsonb', select: false })
  sheets!: Record<string, unknown>[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
