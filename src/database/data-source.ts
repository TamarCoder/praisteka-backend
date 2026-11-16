import { DataSource } from 'typeorm';
import { Session } from '../auth/entities/session.entity.js';
import { Company } from '../companies/entities/company.entity.js';
import { ErrorEvent } from '../error-events/entities/error-event.entity.js';
import { Snapshot } from '../files/entities/snapshot.entity.js';
import { UserFile } from '../files/entities/user-file.entity.js';
import { Folder } from '../folders/entities/folder.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateInitialSchema1763300000000 } from './migrations/1763300000000-create-initial-schema.js';

// Used by the CLI scripts (migrations, admin:create), outside the Nest app.
export const databaseDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true',
  entities: [User, Session, Company, Folder, UserFile, Snapshot, ErrorEvent],
  migrations: [CreateInitialSchema1763300000000],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
});
