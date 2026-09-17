import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 3 — fees and payments. Adds new tables only; existing data is not changed.
 */

export class Phase3Fees1789586905220 implements MigrationInterface {
    name = 'Phase3Fees1789586905220'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "student_fees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "institute_id" uuid NOT NULL, "student_id" uuid NOT NULL, "enrollment_id" uuid, "batch_id" uuid, "type" character varying(20) NOT NULL, "title" character varying NOT NULL, "period" character varying(7), "amount" numeric(10,2) NOT NULL, "discount" numeric(10,2) NOT NULL DEFAULT '0', "paidAmount" numeric(10,2) NOT NULL DEFAULT '0', "status" character varying(20) NOT NULL DEFAULT 'unpaid', "dueDate" date, "note" character varying, "waivedReason" character varying, "created_by_id" uuid, CONSTRAINT "CHK_a766653b07ed2e1952e6f367ea" CHECK ("paidAmount" <= "amount" - "discount"), CONSTRAINT "CHK_f3cacd737de27e904ef51aa989" CHECK ("discount" <= "amount"), CONSTRAINT "CHK_6aff242a958327228f2a60ddcb" CHECK ("amount" >= 0 AND "discount" >= 0 AND "paidAmount" >= 0), CONSTRAINT "PK_a2cec5273eddb36c724e226cf13" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9e8969b8c743de99403b16b592" ON "student_fees" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d9180cebe459882be4b6bb06ca" ON "student_fees" ("institute_id", "status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_847415c6746eb9018146f40f5e" ON "student_fees" ("enrollment_id", "period") WHERE "type" = 'monthly' AND "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE TABLE "payment_allocations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "payment_id" uuid NOT NULL, "fee_id" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_543d0d1d3e6a5dd47d3083840f" CHECK ("amount" > 0), CONSTRAINT "PK_a5c6ff22065ac772620c85f4efb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_46eddd4f47c3e8b389b3972393" ON "payment_allocations" ("fee_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_422fa358789167681c4a4ca1ae" ON "payment_allocations" ("payment_id", "fee_id") `);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "institute_id" uuid NOT NULL, "student_id" uuid NOT NULL, "receiptNo" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "method" character varying(20) NOT NULL, "reference" character varying, "paidAt" date NOT NULL, "note" character varying, "received_by_id" uuid, "voidedAt" TIMESTAMP WITH TIME ZONE, "voided_by_id" uuid, "voidReason" character varying, CONSTRAINT "CHK_74f1d9367b587c6ebcf04ed4da" CHECK ("amount" > 0), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9fd5d6ef620b0140a67ff2d95c" ON "payments" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c249267aaf262aa7350d65b75a" ON "payments" ("institute_id", "paidAt") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_04c09daacfc5adbdc17284ffc2" ON "payments" ("institute_id", "receiptNo") `);
        await queryRunner.query(`ALTER TABLE "student_fees" ADD CONSTRAINT "FK_b5f7e69620253deb55363dc249d" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_fees" ADD CONSTRAINT "FK_9e8969b8c743de99403b16b592c" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_fees" ADD CONSTRAINT "FK_5de90824d111fe2583354ece420" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_fees" ADD CONSTRAINT "FK_b039405f21e1a52efbb51623f54" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_allocations" ADD CONSTRAINT "FK_4348f49c6822420b9503ba880b8" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_allocations" ADD CONSTRAINT "FK_46eddd4f47c3e8b389b3972393c" FOREIGN KEY ("fee_id") REFERENCES "student_fees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_86039374165a267062e29f671dc" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_9fd5d6ef620b0140a67ff2d95c4" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_fdb95dd85ac02027afaed80f139" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_fdb95dd85ac02027afaed80f139"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_9fd5d6ef620b0140a67ff2d95c4"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_86039374165a267062e29f671dc"`);
        await queryRunner.query(`ALTER TABLE "payment_allocations" DROP CONSTRAINT "FK_46eddd4f47c3e8b389b3972393c"`);
        await queryRunner.query(`ALTER TABLE "payment_allocations" DROP CONSTRAINT "FK_4348f49c6822420b9503ba880b8"`);
        await queryRunner.query(`ALTER TABLE "student_fees" DROP CONSTRAINT "FK_b039405f21e1a52efbb51623f54"`);
        await queryRunner.query(`ALTER TABLE "student_fees" DROP CONSTRAINT "FK_5de90824d111fe2583354ece420"`);
        await queryRunner.query(`ALTER TABLE "student_fees" DROP CONSTRAINT "FK_9e8969b8c743de99403b16b592c"`);
        await queryRunner.query(`ALTER TABLE "student_fees" DROP CONSTRAINT "FK_b5f7e69620253deb55363dc249d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_04c09daacfc5adbdc17284ffc2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c249267aaf262aa7350d65b75a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9fd5d6ef620b0140a67ff2d95c"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_422fa358789167681c4a4ca1ae"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_46eddd4f47c3e8b389b3972393"`);
        await queryRunner.query(`DROP TABLE "payment_allocations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_847415c6746eb9018146f40f5e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d9180cebe459882be4b6bb06ca"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9e8969b8c743de99403b16b592"`);
        await queryRunner.query(`DROP TABLE "student_fees"`);
    }

}
