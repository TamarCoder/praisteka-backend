import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const ERROR_ACTIONS = ['register', 'login', 'createFolder', 'upload', 'viewHistory'] as const;
export type ErrorAction = (typeof ERROR_ACTIONS)[number];

// A failure a user hit, reported by the frontend or recorded by the API.
@Entity('error_events')
export class ErrorEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // null when the user is unknown (failed register / login)
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 254, default: '' })
  email!: string;

  @Column({ type: 'varchar', length: 32 })
  action!: ErrorAction;

  @Column({ type: 'varchar', length: 64 })
  code!: string;

  @Column({ type: 'varchar', length: 1000 })
  message!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
