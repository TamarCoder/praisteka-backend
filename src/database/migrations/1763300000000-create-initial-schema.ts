import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1763300000000 implements MigrationInterface {
  name = 'CreateInitialSchema1763300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(100) NOT NULL,
        "email" character varying(254) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" character varying(16) NOT NULL DEFAULT 'user',
        "status" character varying(16) NOT NULL DEFAULT 'active',
        "last_seen_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "CHK_users_role" CHECK ("role" IN ('user', 'admin')),
        CONSTRAINT "CHK_users_status" CHECK ("status" IN ('active', 'pending', 'blocked'))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "token_hash" character(64) NOT NULL,
        "user_id" uuid NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sessions_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id")`);
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "name" character varying(200) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_companies_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_companies_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_companies_user_name" ON "companies" ("user_id", lower("name"))`,
    );
    await queryRunner.query(`
      CREATE TABLE "folders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "name" character varying(120) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_folders_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_folders_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_folders_user_name" ON "folders" ("user_id", lower("name"))`,
    );
    await queryRunner.query(`
      CREATE TABLE "files" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "folder_id" uuid,
        "file_name" character varying(255) NOT NULL,
        "effective_from" date NOT NULL,
        "sheets" jsonb NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_files_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_files_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_files_company" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_files_folder" FOREIGN KEY ("folder_id") REFERENCES "folders" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_files_user_id" ON "files" ("user_id")`);
    await queryRunner.query(`
      CREATE TABLE "snapshots" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "file_id" uuid NOT NULL,
        "n" integer NOT NULL,
        "note" character varying(500) NOT NULL DEFAULT '',
        "sheets" jsonb NOT NULL,
        "saved_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_snapshots_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_snapshots_file_n" UNIQUE ("file_id", "n"),
        CONSTRAINT "FK_snapshots_file" FOREIGN KEY ("file_id") REFERENCES "files" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "error_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "email" character varying(254) NOT NULL DEFAULT '',
        "action" character varying(32) NOT NULL,
        "code" character varying(64) NOT NULL,
        "message" character varying(1000) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_error_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_error_events_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
        CONSTRAINT "CHK_error_events_action" CHECK ("action" IN ('register', 'login', 'createFolder', 'upload', 'viewHistory'))
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_error_events_created_at" ON "error_events" ("created_at" DESC)`);
    await queryRunner.query(`CREATE INDEX "IDX_error_events_user_id" ON "error_events" ("user_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "error_events"`);
    await queryRunner.query(`DROP TABLE "snapshots"`);
    await queryRunner.query(`DROP TABLE "files"`);
    await queryRunner.query(`DROP TABLE "folders"`);
    await queryRunner.query(`DROP TABLE "companies"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
