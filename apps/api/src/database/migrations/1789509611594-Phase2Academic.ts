import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 2 — academic structure.
 * New: academic_sessions, classes, guardians, enrollments.
 * Moves existing data: batch session text -> sessions, student guardian
 * name/phone -> guardians, student_batches -> enrollments.
 */

export class Phase2Academic1789509611594 implements MigrationInterface {
    name = 'Phase2Academic1789509611594'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "guardians" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "fullName" character varying NOT NULL, "phone" character varying, "email" character varying, "occupation" character varying, "address" character varying, "user_id" uuid, "institute_id" uuid NOT NULL, CONSTRAINT "REL_f1d05a3a2d70db0a25479b6718" UNIQUE ("user_id"), CONSTRAINT "PK_3dcf02f3dc96a2c017106f280be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ebafb26f11403c7ad90ad0f79b" ON "guardians" ("institute_id", "phone") WHERE "phone" IS NOT NULL AND "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE TABLE "academic_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "startDate" date, "endDate" date, "isCurrent" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "institute_id" uuid NOT NULL, CONSTRAINT "PK_8dba9ed9bef819af7a31769c04b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9225ead1d70ce0c49246917eb9" ON "academic_sessions" ("institute_id") WHERE "isCurrent" = true AND "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ff8b923f30df546641acdf4783" ON "academic_sessions" ("institute_id", "name") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE TABLE "classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "code" character varying, "sortOrder" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "institute_id" uuid NOT NULL, CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2025725c4677c95a6fe416985c" ON "classes" ("institute_id", "name") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE TABLE "enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "student_id" uuid NOT NULL, "batch_id" uuid NOT NULL, "institute_id" uuid NOT NULL, "enrolledAt" date NOT NULL DEFAULT ('now'::text)::date, "leftAt" date, "status" character varying(20) NOT NULL DEFAULT 'active', "feeOverride" numeric(10,2), CONSTRAINT "PK_7c0f752f9fb68bf6ed7367ab00f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_307813fe255896d6ebf3e6cd55" ON "enrollments" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_314e747891d5555efc344bd288" ON "enrollments" ("batch_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_afe2a200354d2b6e934e13a19f" ON "enrollments" ("student_id", "batch_id") WHERE "status" = 'active' AND "deleted_at" IS NULL`);
        await queryRunner.query(`ALTER TABLE "batches" ADD "session_id" uuid`);
        await queryRunner.query(`ALTER TABLE "batches" ADD "class_id" uuid`);
        await queryRunner.query(`ALTER TABLE "students" ADD "guardian_id" uuid`);
        await queryRunner.query(`ALTER TABLE "students" ADD "guardianRelation" character varying(20)`);
        await queryRunner.query(`CREATE INDEX "IDX_bb4d7666efc93915ddb8474524" ON "students" ("guardian_id") `);
        await queryRunner.query(`ALTER TABLE "guardians" ADD CONSTRAINT "FK_f1d05a3a2d70db0a25479b67189" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "guardians" ADD CONSTRAINT "FK_a7b5e191c8b9bb03ebf87c27719" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "academic_sessions" ADD CONSTRAINT "FK_715d7c57ad00ec445785d8349d2" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_c32af33a4d3872a3508fa794994" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "batches" ADD CONSTRAINT "FK_271089b0c13ec85177e2fbb9606" FOREIGN KEY ("session_id") REFERENCES "academic_sessions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "batches" ADD CONSTRAINT "FK_9127eabe84ba85288e9605a213f" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_307813fe255896d6ebf3e6cd55c" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_314e747891d5555efc344bd2887" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_3e4d9a7d0b52136caee06d34085" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_bb4d7666efc93915ddb84745244" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        // ---------------------------------------------------------------
        // Data backfill: move Phase 1.5 data into the new tables BEFORE the
        // old columns / join table are dropped.
        // ---------------------------------------------------------------

        // 1. batches.session (free text) -> academic_sessions + batches.session_id
        await queryRunner.query(`
            INSERT INTO "academic_sessions" ("institute_id", "name")
            SELECT DISTINCT b."institute_id", trim(b."session")
            FROM "batches" b
            WHERE NULLIF(trim(b."session"), '') IS NOT NULL`);
        await queryRunner.query(`
            UPDATE "batches" b SET "session_id" = s."id"
            FROM "academic_sessions" s
            WHERE s."institute_id" = b."institute_id" AND s."name" = trim(b."session")`);

        // 2a. students.guardianName/Phone -> guardians. Same phone in the same
        //     institute = same guardian (siblings share one record).
        await queryRunner.query(`
            INSERT INTO "guardians" ("institute_id", "fullName", "phone")
            SELECT DISTINCT ON (s."institute_id", trim(s."guardianPhone"))
                   s."institute_id",
                   COALESCE(NULLIF(trim(s."guardianName"), ''), 'Guardian'),
                   trim(s."guardianPhone")
            FROM "students" s
            WHERE NULLIF(trim(s."guardianPhone"), '') IS NOT NULL
            ORDER BY s."institute_id", trim(s."guardianPhone"), (s."deleted_at" IS NULL) DESC, s."created_at"`);
        await queryRunner.query(`
            UPDATE "students" s SET "guardian_id" = g."id"
            FROM "guardians" g
            WHERE g."institute_id" = s."institute_id" AND g."phone" = trim(s."guardianPhone")`);

        // 2b. A guardian name without a phone can't be matched safely, so each
        //     such student gets their own guardian record.
        await queryRunner.query(`
            WITH src AS (
                SELECT s."id" AS student_id, s."institute_id", trim(s."guardianName") AS name, uuid_generate_v4() AS gid
                FROM "students" s
                WHERE s."guardian_id" IS NULL AND NULLIF(trim(s."guardianName"), '') IS NOT NULL
            ), ins AS (
                INSERT INTO "guardians" ("id", "institute_id", "fullName")
                SELECT gid, "institute_id", name FROM src
            )
            UPDATE "students" s SET "guardian_id" = src.gid FROM src WHERE s."id" = src.student_id`);

        // 2c. Guardians whose children are all deleted are archived too.
        await queryRunner.query(`
            UPDATE "guardians" g SET "deleted_at" = now()
            WHERE NOT EXISTS (
                SELECT 1 FROM "students" s WHERE s."guardian_id" = g."id" AND s."deleted_at" IS NULL)`);

        // 3. student_batches -> enrollments (joined on the admission date).
        //    Rows for deleted students are recorded as "left".
        await queryRunner.query(`
            INSERT INTO "enrollments" ("institute_id", "student_id", "batch_id", "enrolledAt", "leftAt", "status")
            SELECT s."institute_id", sb."studentsId", sb."batchesId", s."admissionDate",
                   CASE WHEN s."deleted_at" IS NULL THEN NULL ELSE GREATEST(s."deleted_at"::date, s."admissionDate") END,
                   CASE WHEN s."deleted_at" IS NULL THEN 'active' ELSE 'left' END
            FROM "student_batches" sb
            JOIN "students" s ON s."id" = sb."studentsId"`);

        // ---- Old structures are no longer needed ----
        await queryRunner.query(`DROP TABLE "student_batches"`);
        await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "session"`);
        await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "guardianName"`);
        await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "guardianPhone"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate the Phase 1.5 structures first, copy data back, then drop the new ones.
        await queryRunner.query(`ALTER TABLE "students" ADD "guardianPhone" character varying`);
        await queryRunner.query(`ALTER TABLE "students" ADD "guardianName" character varying`);
        await queryRunner.query(`ALTER TABLE "batches" ADD "session" character varying`);
        await queryRunner.query(`CREATE TABLE "student_batches" ("studentsId" uuid NOT NULL, "batchesId" uuid NOT NULL, CONSTRAINT "PK_54322596fdcab23cf5dfa51c47d" PRIMARY KEY ("studentsId", "batchesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_12bfbc89b3824d367fbc073862" ON "student_batches" ("studentsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_bdbc9d244faca95de6b9b9b5f7" ON "student_batches" ("batchesId") `);
        await queryRunner.query(`ALTER TABLE "student_batches" ADD CONSTRAINT "FK_12bfbc89b3824d367fbc073862a" FOREIGN KEY ("studentsId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "student_batches" ADD CONSTRAINT "FK_bdbc9d244faca95de6b9b9b5f71" FOREIGN KEY ("batchesId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`
            UPDATE "batches" b SET "session" = s."name"
            FROM "academic_sessions" s WHERE s."id" = b."session_id"`);
        await queryRunner.query(`
            UPDATE "students" s SET "guardianName" = g."fullName", "guardianPhone" = g."phone"
            FROM "guardians" g WHERE g."id" = s."guardian_id"`);
        await queryRunner.query(`
            INSERT INTO "student_batches" ("studentsId", "batchesId")
            SELECT DISTINCT "student_id", "batch_id" FROM "enrollments"
            WHERE "deleted_at" IS NULL AND ("status" = 'active' OR "student_id" IN (SELECT "id" FROM "students" WHERE "deleted_at" IS NOT NULL))`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_bb4d7666efc93915ddb84745244"`);
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_3e4d9a7d0b52136caee06d34085"`);
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_314e747891d5555efc344bd2887"`);
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_307813fe255896d6ebf3e6cd55c"`);
        await queryRunner.query(`ALTER TABLE "batches" DROP CONSTRAINT "FK_9127eabe84ba85288e9605a213f"`);
        await queryRunner.query(`ALTER TABLE "batches" DROP CONSTRAINT "FK_271089b0c13ec85177e2fbb9606"`);
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT "FK_c32af33a4d3872a3508fa794994"`);
        await queryRunner.query(`ALTER TABLE "academic_sessions" DROP CONSTRAINT "FK_715d7c57ad00ec445785d8349d2"`);
        await queryRunner.query(`ALTER TABLE "guardians" DROP CONSTRAINT "FK_a7b5e191c8b9bb03ebf87c27719"`);
        await queryRunner.query(`ALTER TABLE "guardians" DROP CONSTRAINT "FK_f1d05a3a2d70db0a25479b67189"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb4d7666efc93915ddb8474524"`);
        await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "guardianRelation"`);
        await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "guardian_id"`);
        await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "class_id"`);
        await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "session_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_afe2a200354d2b6e934e13a19f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_314e747891d5555efc344bd288"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_307813fe255896d6ebf3e6cd55"`);
        await queryRunner.query(`DROP TABLE "enrollments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2025725c4677c95a6fe416985c"`);
        await queryRunner.query(`DROP TABLE "classes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff8b923f30df546641acdf4783"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9225ead1d70ce0c49246917eb9"`);
        await queryRunner.query(`DROP TABLE "academic_sessions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ebafb26f11403c7ad90ad0f79b"`);
        await queryRunner.query(`DROP TABLE "guardians"`);
    }

}
