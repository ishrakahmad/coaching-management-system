import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { FeeStatus, FeeType, StudentFee } from './entities/student-fee.entity';
import { Student } from '../students/entities/student.entity';
import { Batch } from '../batches/entities/batch.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CreateFeeDto, DuesQueryDto, FeesQueryDto, UpdateFeeDto } from './dto/fee.dto';
import { computeFeeStatus, feeDuePaisa, withDueAmount } from './fee-status';
import { fromPaisa, toPaisa } from '../common/utils/money';
import { currentPeriod, nextPeriod, periodInfo } from '../common/utils/period';
import { todayInDhaka } from '../common/utils/dates';

/** Monthly fees fall due on this day of the billing month. */
export const MONTHLY_DUE_DAY = 10;

@Injectable()
export class FeesService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  /**
   * Bills one month for every enrollment that was running during that month.
   * Safe to run any number of times: an enrollment is billed at most once per month.
   * Amount = the enrollment's feeOverride, else the batch's monthlyFee.
   */
  async generateMonthly(
    instituteId: string,
    period: string,
    options: { batchId?: string; studentId?: string; userId?: string | null; manager?: EntityManager } = {},
  ) {
    const { start, end, label } = periodInfo(period);
    if (period > nextPeriod(currentPeriod())) {
      throw new BadRequestException('Fees can be generated at most one month ahead');
    }
    const db = options.manager ?? this.dataSource.manager;
    if (options.batchId && !(await db.getRepository(Batch).exists({ where: { id: options.batchId, instituteId } }))) {
      throw new BadRequestException(`Unknown batchId: ${options.batchId}`);
    }

    const params: unknown[] = [instituteId, start, end];
    let batchFilter = '';
    if (options.batchId) {
      params.push(options.batchId);
      batchFilter += ` AND e.batch_id = $${params.length}`;
    }
    if (options.studentId) {
      params.push(options.studentId);
      batchFilter += ` AND e.student_id = $${params.length}`;
    }
    const eligible = `
      FROM enrollments e
      JOIN students s ON s.id = e.student_id AND s.deleted_at IS NULL AND s.status = 'active'
      JOIN batches b ON b.id = e.batch_id AND b.deleted_at IS NULL AND b."isActive" = true
      WHERE e.institute_id = $1 AND e.deleted_at IS NULL
        AND e."enrolledAt" <= $3::date
        AND (e."leftAt" IS NULL OR e."leftAt" >= $2::date)
        AND COALESCE(e."feeOverride", b."monthlyFee") > 0
        ${batchFilter}`;

    const run = async (manager: EntityManager) => {
      const [{ count }] = await manager.query(`SELECT COUNT(*)::int AS count ${eligible}`, params);
      const insertParams = [...params, period, label, `${period}-${String(MONTHLY_DUE_DAY).padStart(2, '0')}`, options.userId ?? null];
      const n = params.length;
      const inserted = await manager.query(
        `INSERT INTO student_fees
           (institute_id, student_id, enrollment_id, batch_id, type, title, period, amount, "dueDate", created_by_id)
         SELECT e.institute_id, e.student_id, e.id, e.batch_id, 'monthly',
                $${n + 2} || ' - ' || b.name, $${n + 1}, COALESCE(e."feeOverride", b."monthlyFee"),
                -- Due on the 10th, but never before the student joined (a student joining on the
                -- 20th must not start with an already overdue fee).
                GREATEST($${n + 3}::date, e."enrolledAt"), $${n + 4}::uuid
         ${eligible}
         ON CONFLICT (enrollment_id, period) WHERE "type" = 'monthly' AND "deleted_at" IS NULL DO NOTHING
         RETURNING id`,
        insertParams,
      );
      const created = Array.isArray(inserted[0]) ? inserted[0].length : inserted.length;
      return { period, label, eligible: count, created, alreadyBilled: count - created };
    };
    return options.manager ? run(options.manager) : this.dataSource.transaction(run);
  }

  async create(instituteId: string, dto: CreateFeeDto, userId: string) {
    const student = await this.dataSource.getRepository(Student).findOne({ where: { id: dto.studentId, instituteId } });
    if (!student) throw new BadRequestException(`Unknown studentId: ${dto.studentId}`);
    if (dto.batchId && !(await this.dataSource.getRepository(Batch).exists({ where: { id: dto.batchId, instituteId } }))) {
      throw new BadRequestException(`Unknown batchId: ${dto.batchId}`);
    }
    if (toPaisa(dto.discount) > toPaisa(dto.amount)) {
      throw new BadRequestException('Discount cannot be more than the amount');
    }
    const repo = this.dataSource.getRepository(StudentFee);
    const fee = await repo.save(
      repo.create({
        instituteId,
        studentId: dto.studentId,
        batchId: dto.batchId ?? null,
        type: dto.type,
        title: dto.title,
        amount: dto.amount,
        discount: dto.discount ?? 0,
        dueDate: dto.dueDate ?? todayInDhaka(),
        note: dto.note,
        createdById: userId,
        status: FeeStatus.UNPAID,
      }),
    );
    return this.findOne(fee.id, instituteId);
  }

  async findOne(id: string, instituteId: string) {
    const fee = await this.dataSource.getRepository(StudentFee).findOne({
      where: { id, instituteId },
      relations: ['student', 'student.user', 'batch'],
    });
    if (!fee) throw new NotFoundException('Fee not found');
    return withDueAmount(fee);
  }

  async findAll(instituteId: string, query: FeesQueryDto) {
    const qb = this.dataSource
      .getRepository(StudentFee)
      .createQueryBuilder('fee')
      .leftJoinAndSelect('fee.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('fee.batch', 'batch')
      .where('fee.instituteId = :instituteId', { instituteId })
      .orderBy('fee.dueDate', 'DESC', 'NULLS LAST')
      .addOrderBy('user.fullName', 'ASC')
      .take(500);
    if (query.period) qb.andWhere('fee.period = :period', { period: query.period });
    if (query.batchId) qb.andWhere('fee.batchId = :batchId', { batchId: query.batchId });
    if (query.status) qb.andWhere('fee.status = :status', { status: query.status });
    return (await qb.getMany()).map(withDueAmount);
  }

  /** Fee card for one student: every fee, every payment, and totals. */
  async ledger(studentId: string, instituteId: string) {
    const student = await this.dataSource.getRepository(Student).findOne({
      where: { id: studentId, instituteId },
      relations: ['user', 'guardian'],
    });
    if (!student) throw new NotFoundException('Student not found');

    const fees = (
      await this.dataSource.getRepository(StudentFee).find({
        where: { studentId, instituteId },
        relations: ['batch'],
        order: { dueDate: 'DESC', createdAt: 'DESC' },
      })
    ).map(withDueAmount);
    const payments = await this.dataSource.getRepository(Payment).find({
      where: { studentId, instituteId },
      relations: ['allocations', 'allocations.fee', 'receivedBy'],
      order: { paidAt: 'DESC', createdAt: 'DESC' },
    });

    const active = fees.filter((f) => f.status !== FeeStatus.WAIVED);
    const sum = (values: number[]) => fromPaisa(values.reduce((a, b) => a + b, 0));
    return {
      student,
      summary: {
        billed: sum(active.map((f) => toPaisa(f.amount))),
        discount: sum(active.map((f) => toPaisa(f.discount))),
        paid: sum(active.map((f) => toPaisa(f.paidAmount))),
        due: sum(active.map(feeDuePaisa)),
        waived: sum(fees.filter((f) => f.status === FeeStatus.WAIVED).map((f) => toPaisa(f.amount) - toPaisa(f.discount))),
      },
      fees,
      payments,
    };
  }

  /** Change title, amount, discount, due date or note. The net amount can't drop below what's already paid. */
  async update(id: string, instituteId: string, dto: UpdateFeeDto) {
    await this.dataSource.transaction(async (manager) => {
      const fee = await this.lockFee(manager, id, instituteId);
      if (fee.status === FeeStatus.WAIVED) throw new ConflictException('A waived fee cannot be changed');
      const next = { ...fee, amount: dto.amount ?? fee.amount, discount: dto.discount ?? fee.discount };
      if (toPaisa(next.discount) > toPaisa(next.amount)) {
        throw new BadRequestException('Discount cannot be more than the amount');
      }
      if (toPaisa(next.amount) - toPaisa(next.discount) < toPaisa(fee.paidAmount)) {
        throw new BadRequestException(`Net amount cannot be less than the ৳${fee.paidAmount} already paid`);
      }
      await manager.update(StudentFee, { id }, {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate }),
        amount: next.amount,
        discount: next.discount,
        status: computeFeeStatus(next),
      });
    });
    return this.findOne(id, instituteId);
  }

  /** Cancel a fee nobody has paid anything towards. It stays on record as waived. */
  async waive(id: string, instituteId: string, reason: string) {
    await this.dataSource.transaction(async (manager) => {
      const fee = await this.lockFee(manager, id, instituteId);
      if (fee.status === FeeStatus.WAIVED) throw new ConflictException('Fee is already waived');
      if (toPaisa(fee.paidAmount) > 0) {
        throw new ConflictException('Part of this fee is paid. Give a discount for the rest, or void the payment first.');
      }
      await manager.update(StudentFee, { id }, { status: FeeStatus.WAIVED, waivedReason: reason });
    });
    return this.findOne(id, instituteId);
  }

  /** Only a one-off fee added by mistake. Monthly fees are waived instead, so generation doesn't bill them again. */
  async remove(id: string, instituteId: string) {
    await this.dataSource.transaction(async (manager) => {
      const fee = await this.lockFee(manager, id, instituteId);
      if (fee.type === FeeType.MONTHLY) throw new ConflictException('Monthly fees cannot be deleted. Waive it instead.');
      if (toPaisa(fee.paidAmount) > 0) throw new ConflictException('Fee has payments. Void them first.');
      await manager.softDelete(StudentFee, { id });
    });
    return { id, deleted: true };
  }

  /** Who owes money, most first. */
  async dues(instituteId: string, query: DuesQueryDto) {
    // $2 is always "today" in Bangladesh time, so overdue logic doesn't depend on the database server's timezone.
    const params: unknown[] = [instituteId, todayInDhaka()];
    const where: string[] = [];
    if (query.batchId) {
      params.push(query.batchId);
      where.push(`f.batch_id = $${params.length}`);
    }
    if (query.overdueOnly === 'true') {
      where.push(`f."dueDate" < $2::date`);
    }
    const term = query.search?.trim();
    if (term) {
      params.push(`%${term}%`);
      const p = `$${params.length}`;
      const digits = term.replace(/\D/g, '').replace(/^88/, '');
      let phone = '';
      if (digits.length >= 3) {
        params.push(`%${digits}%`);
        phone = ` OR g.phone LIKE $${params.length}`;
      }
      where.push(`(u."fullName" ILIKE ${p} OR s."studentId" ILIKE ${p}${phone})`);
    }

    const rows: Array<Record<string, any>> = await this.dataSource.query(
      `SELECT s.id, s."studentId" AS "studentCode", u."fullName", u.phone,
              g."fullName" AS "guardianName", g.phone AS "guardianPhone",
              SUM(f.amount - f.discount - f."paidAmount") AS due,
              COUNT(*)::int AS "feeCount",
              MIN(f."dueDate")::text AS "oldestDueDate",
              COUNT(*) FILTER (WHERE f."dueDate" < $2::date)::int AS "overdueCount"
       FROM student_fees f
       JOIN students s ON s.id = f.student_id AND s.deleted_at IS NULL
       JOIN users u ON u.id = s.user_id
       LEFT JOIN guardians g ON g.id = s.guardian_id AND g.deleted_at IS NULL
       WHERE f.institute_id = $1 AND f.deleted_at IS NULL AND f.status IN ('unpaid', 'partial')
         ${where.map((w) => `AND ${w}`).join(' ')}
       GROUP BY s.id, u.id, g.id
       ORDER BY due DESC, u."fullName" ASC`,
      params,
    );
    const students = rows.map((r) => ({
      ...r,
      due: Number(r.due),
    }));
    return {
      totalDue: fromPaisa(students.reduce((total, r) => total + toPaisa(r.due), 0)),
      studentCount: students.length,
      students,
    };
  }

  /** Money in and money owed for one month, for the dashboard. */
  async summary(instituteId: string, period = currentPeriod()) {
    const { start, end, label } = periodInfo(period);
    const [collected] = await this.dataSource.query(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*)::int AS count
       FROM payments WHERE institute_id = $1 AND deleted_at IS NULL AND "voidedAt" IS NULL
         AND "paidAt" BETWEEN $2::date AND $3::date`,
      [instituteId, start, end],
    );
    const byMethod = await this.dataSource.query(
      `SELECT method, COALESCE(SUM(amount), 0) AS total, COUNT(*)::int AS count
       FROM payments WHERE institute_id = $1 AND deleted_at IS NULL AND "voidedAt" IS NULL
         AND "paidAt" BETWEEN $2::date AND $3::date
       GROUP BY method ORDER BY total DESC`,
      [instituteId, start, end],
    );
    const [billed] = await this.dataSource.query(
      `SELECT COALESCE(SUM(amount - discount), 0) AS total, COUNT(*)::int AS count
       FROM student_fees WHERE institute_id = $1 AND deleted_at IS NULL AND status <> 'waived' AND period = $2`,
      [instituteId, period],
    );
    const [outstanding] = await this.dataSource.query(
      `SELECT COALESCE(SUM(f.amount - f.discount - f."paidAmount"), 0) AS total, COUNT(DISTINCT f.student_id)::int AS students
       FROM student_fees f JOIN students s ON s.id = f.student_id AND s.deleted_at IS NULL
       WHERE f.institute_id = $1 AND f.deleted_at IS NULL AND f.status IN ('unpaid', 'partial')`,
      [instituteId],
    );
    const [today] = await this.dataSource.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
       WHERE institute_id = $1 AND deleted_at IS NULL AND "voidedAt" IS NULL AND "paidAt" = $2::date`,
      [instituteId, todayInDhaka()],
    );
    return {
      period,
      label,
      collected: { total: Number(collected.total), count: collected.count },
      collectedToday: Number(today.total),
      byMethod: byMethod.map((m: any) => ({ method: m.method, total: Number(m.total), count: m.count })),
      billed: { total: Number(billed.total), count: billed.count },
      outstanding: { total: Number(outstanding.total), students: outstanding.students },
    };
  }

  private async lockFee(manager: EntityManager, id: string, instituteId: string) {
    const fee = await manager
      .getRepository(StudentFee)
      .createQueryBuilder('fee')
      .setLock('pessimistic_write')
      .where('fee.id = :id AND fee.instituteId = :instituteId', { id, instituteId })
      .getOne();
    if (!fee) throw new NotFoundException('Fee not found');
    return fee;
  }
}
