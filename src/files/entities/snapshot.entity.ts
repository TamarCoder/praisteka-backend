import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// A saved version of a file: a copy of its sheets at that moment.
@Entity('snapshots')
export class Snapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'file_id', type: 'uuid' })
  fileId!: string;

  // 1, 2, 3… inside one file
  @Column({ type: 'int' })
  n!: number;

  @Column({ type: 'varchar', length: 500, default: '' })
  note!: string;

  @Column({ type: 'jsonb', select: false })
  sheets!: Record<string, unknown>[];

  @CreateDateColumn({ name: 'saved_at', type: 'timestamptz' })
  savedAt!: Date;
}
