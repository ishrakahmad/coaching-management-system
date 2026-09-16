import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Baseline = the Phase 1.5 schema.
 * Databases created earlier with `synchronize: true` already have these
 * tables, so this migration only records itself as done for them.
 */

export class InitialSchema1789509373830 implements MigrationInterface {
    name = 'InitialSchema1789509373830'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        if (await queryRunner.hasTable('users')) {
            console.log('[InitialSchema] Existing Phase 1.5 schema detected — skipping table creation.');
            return;
        }
        await queryRunner.query(`CREATE TABLE "id_counters" ("institute_id" uuid NOT NULL, "scope" character varying NOT NULL, "value" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_2e40d173776beb702e975383087" PRIMARY KEY ("institute_id", "scope"))`);
        await queryRunner.query(`CREATE TABLE "institutes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "slug" character varying NOT NULL, "logoUrl" character varying, "address" character varying, "phone" character varying, "email" character varying, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_690469c9dd528ef58e27c8cec04" UNIQUE ("slug"), CONSTRAINT "PK_96d2373e91ae5841128f8eb3b42" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('super_admin', 'institute_admin', 'manager', 'accountant', 'teacher', 'employee', 'student', 'guardian')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "fullName" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'student', "isActive" boolean NOT NULL DEFAULT true, "avatarUrl" character varying, "institute_id" uuid NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "subjects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "code" character varying, "institute_id" uuid NOT NULL, CONSTRAINT "PK_1a023685ac2b051b4e557b0b280" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "teachers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "institute_id" uuid NOT NULL, "designation" character varying, "qualification" character varying, "monthlySalary" numeric(10,2), "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_4668d4752e6766682d1be0b346" UNIQUE ("user_id"), CONSTRAINT "PK_a8d4f83be3abe4c687b0a0093c8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "batches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "session" character varying, "monthlyFee" numeric(10,2) NOT NULL DEFAULT '0', "schedule" character varying, "isActive" boolean NOT NULL DEFAULT true, "institute_id" uuid NOT NULL, "lead_teacher_id" uuid, CONSTRAINT "PK_55e7ff646e969b61d37eea5be7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."students_status_enum" AS ENUM('active', 'inactive', 'transferred', 'graduated')`);
        await queryRunner.query(`CREATE TABLE "students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "institute_id" uuid NOT NULL, "studentId" character varying NOT NULL, "guardianName" character varying, "guardianPhone" character varying, "address" character varying, "dateOfBirth" date, "status" "public"."students_status_enum" NOT NULL DEFAULT 'active', "admissionDate" date NOT NULL DEFAULT ('now'::text)::date, CONSTRAINT "REL_fb3eff90b11bddf7285f9b4e28" UNIQUE ("user_id"), CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5b290fa6e4d757ac9bc5653414" ON "students" ("institute_id", "studentId") `);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "token_hash" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3ddc983c5f7bcf132fd8732c3f" ON "refresh_tokens" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "teacher_subjects" ("teachersId" uuid NOT NULL, "subjectsId" uuid NOT NULL, CONSTRAINT "PK_aa601ddbc7539a3c811d1a61f10" PRIMARY KEY ("teachersId", "subjectsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c5f37c40dbec97486c89aac827" ON "teacher_subjects" ("teachersId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b3895344c549b2d1ed3cd0c7a7" ON "teacher_subjects" ("subjectsId") `);
        await queryRunner.query(`CREATE TABLE "batch_subjects" ("batchesId" uuid NOT NULL, "subjectsId" uuid NOT NULL, CONSTRAINT "PK_3c4b25a49a065513547216b0ee7" PRIMARY KEY ("batchesId", "subjectsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dd222af1a4e15420454c831c22" ON "batch_subjects" ("batchesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d90b13383dfafa0be2e5dc0c87" ON "batch_subjects" ("subjectsId") `);
        await queryRunner.query(`CREATE TABLE "student_batches" ("studentsId" uuid NOT NULL, "batchesId" uuid NOT NULL, CONSTRAINT "PK_54322596fdcab23cf5dfa51c47d" PRIMARY KEY ("studentsId", "batchesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_12bfbc89b3824d367fbc073862" ON "student_batches" ("studentsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_bdbc9d244faca95de6b9b9b5f7" ON "student_batches" ("batchesId") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_d11afe6995bfdb198cb9ee0dde2" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subjects" ADD CONSTRAINT "FK_31ce5efac405256a51668a0e34e" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teachers" ADD CONSTRAINT "FK_4668d4752e6766682d1be0b346f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teachers" ADD CONSTRAINT "FK_96126a231594a99b76cb12fdfca" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "batches" ADD CONSTRAINT "FK_a0490337d2e5b8aed63a4701c3f" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "batches" ADD CONSTRAINT "FK_454400bebc1e8743bdeac2aa1d0" FOREIGN KEY ("lead_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_fb3eff90b11bddf7285f9b4e281" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_293833a3218a32c7a2cda3693f3" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teacher_subjects" ADD CONSTRAINT "FK_c5f37c40dbec97486c89aac8271" FOREIGN KEY ("teachersId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "teacher_subjects" ADD CONSTRAINT "FK_b3895344c549b2d1ed3cd0c7a79" FOREIGN KEY ("subjectsId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "batch_subjects" ADD CONSTRAINT "FK_dd222af1a4e15420454c831c221" FOREIGN KEY ("batchesId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "batch_subjects" ADD CONSTRAINT "FK_d90b13383dfafa0be2e5dc0c870" FOREIGN KEY ("subjectsId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "student_batches" ADD CONSTRAINT "FK_12bfbc89b3824d367fbc073862a" FOREIGN KEY ("studentsId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "student_batches" ADD CONSTRAINT "FK_bdbc9d244faca95de6b9b9b5f71" FOREIGN KEY ("batchesId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student_batches" DROP CONSTRAINT "FK_bdbc9d244faca95de6b9b9b5f71"`);
        await queryRunner.query(`ALTER TABLE "student_batches" DROP CONSTRAINT "FK_12bfbc89b3824d367fbc073862a"`);
        await queryRunner.query(`ALTER TABLE "batch_subjects" DROP CONSTRAINT "FK_d90b13383dfafa0be2e5dc0c870"`);
        await queryRunner.query(`ALTER TABLE "batch_subjects" DROP CONSTRAINT "FK_dd222af1a4e15420454c831c221"`);
        await queryRunner.query(`ALTER TABLE "teacher_subjects" DROP CONSTRAINT "FK_b3895344c549b2d1ed3cd0c7a79"`);
        await queryRunner.query(`ALTER TABLE "teacher_subjects" DROP CONSTRAINT "FK_c5f37c40dbec97486c89aac8271"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_293833a3218a32c7a2cda3693f3"`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_fb3eff90b11bddf7285f9b4e281"`);
        await queryRunner.query(`ALTER TABLE "batches" DROP CONSTRAINT "FK_454400bebc1e8743bdeac2aa1d0"`);
        await queryRunner.query(`ALTER TABLE "batches" DROP CONSTRAINT "FK_a0490337d2e5b8aed63a4701c3f"`);
        await queryRunner.query(`ALTER TABLE "teachers" DROP CONSTRAINT "FK_96126a231594a99b76cb12fdfca"`);
        await queryRunner.query(`ALTER TABLE "teachers" DROP CONSTRAINT "FK_4668d4752e6766682d1be0b346f"`);
        await queryRunner.query(`ALTER TABLE "subjects" DROP CONSTRAINT "FK_31ce5efac405256a51668a0e34e"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_d11afe6995bfdb198cb9ee0dde2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bdbc9d244faca95de6b9b9b5f7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_12bfbc89b3824d367fbc073862"`);
        await queryRunner.query(`DROP TABLE "student_batches"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d90b13383dfafa0be2e5dc0c87"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd222af1a4e15420454c831c22"`);
        await queryRunner.query(`DROP TABLE "batch_subjects"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b3895344c549b2d1ed3cd0c7a7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c5f37c40dbec97486c89aac827"`);
        await queryRunner.query(`DROP TABLE "teacher_subjects"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3ddc983c5f7bcf132fd8732c3f"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b290fa6e4d757ac9bc5653414"`);
        await queryRunner.query(`DROP TABLE "students"`);
        await queryRunner.query(`DROP TYPE "public"."students_status_enum"`);
        await queryRunner.query(`DROP TABLE "batches"`);
        await queryRunner.query(`DROP TABLE "teachers"`);
        await queryRunner.query(`DROP TABLE "subjects"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "institutes"`);
        await queryRunner.query(`DROP TABLE "id_counters"`);
    }

}
