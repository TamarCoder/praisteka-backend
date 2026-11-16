import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// An insurer or clinic whose price list a file belongs to. Scoped per user.
@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
