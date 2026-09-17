import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager, In } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { FeeStatus, FeeType, StudentFee } from '../fees/entities/student-fee.entity';
import { Student } from '../students/entities/student.entity';
import { IdCounterService } from '../common/id-counter/id-counter.service';
import { CreatePaymentDto, PaymentsQueryDto } from './dto/payment.dto';
import { computeFeeStatus, feeDuePaisa } from '../fees/fee-status';
import { fromPaisa, toPaisa } from '../common/utils/money';
import { assertDateOrder, todayInDhaka } from '../common/utils/dates';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private idCounter: IdCounterService,
  ) {}

  /**
   * Records money received and applies it to the student's fees.
   * Without explicit allocations the oldest dues are paid first.
   * Paying more than the total due is rejected (no advance balance yet).
   */
  async create(instituteId: string, userId: string, dto: CreatePaymentDto) {
    const paidAt = dto.paidAt ?? todayInDhaka();
    if (paidAt > todayInDhaka()) throw new BadRequestException('Payment date cannot be in the future');

    const paymentId = await this.dataSource.transaction(async (manager) => {
      const student = await manager.findOne(Student, { where: { id: dto.studentId, instituteId } });
      if (!student) throw new BadRequestException(`Unknown studentId: ${dto.studentId}`);

      const payable = await this.lockPayableFees(manager, instituteId, dto.studentId);
      const plan = dto.allocations
        ? this.explicitPlan(payable, dto)
        : this.oldestFirstPlan(payable, toPaisa(dto.amount));

      const year = paidAt.slice(0, 4);
      const seq = await this.idCounter.next(manager, instituteId, `receipt-${year}`);
      const payment = await manager.save(
        manager.create(Payment, {
          instituteId,
          studentId: dto.studentId,
          receiptNo: `RCP-${year}-${String(seq).padStart(5, '0')}`,
          amount: dto.amount,
          method: dto.method,
          reference: dto.reference,
          paidAt,
          note: dto.note,
          receivedById: userId,
        }),
      );

      for (const { fee, paisa } of plan) {
        await manager.insert(PaymentAllocation, { paymentId: payment.id, feeId: fee.id, amount: fromPaisa(paisa) });
        const paidAmount = fromPaisa(toPaisa(fee.paidAmount) + paisa);
        await manager.update(StudentFee, { id: fee.id }, { paidAmount, status: computeFeeStatus({ ...fee, paidAmount }) });
      }
      return payment.id;
    });
    return this.findOne(paymentId, instituteId);
  }

  /** Reverses a payment: fees go back to unpaid/partial. The receipt number stays, marked void. */
  async void(id: string, instituteId: string, userId: string, reason: string) {
    await this.dataSource.transaction(async (manager) => {
      const payment = await manager
        .getRepository(Payment)
        .createQueryBuilder('p')
        .setLock('pessimistic_write')
        .where('p.id = :id AND p.instituteId = :instituteId', { id, instituteId })
        .getOne();
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.voidedAt) throw new ConflictException('Payment is already void');

      const allocations = await manager.find(PaymentAllocation, { where: { paymentId: id } });
      const fees = await manager
        .getRepository(StudentFee)
        .createQueryBuilder('fee')
        .setLock('pessimistic_write')
        .where({ id: In(allocations.map((a) => a.feeId)) })
        .orderBy('fee.id') // same lock order as create(): no deadlocks
        .getMany();
      const byId = new Map(fees.map((f) => [f.id, f]));

      for (const allocation of allocations) {
        const fee = byId.get(allocation.feeId)!;
        const paidAmount = fromPaisa(toPaisa(fee.paidAmount) - toPaisa(allocation.amount));
        await manager.update(StudentFee, { id: fee.id }, { paidAmount, status: computeFeeStatus({ ...fee, paidAmount }) });
      }
      await manager.update(Payment, { id }, { voidedAt: new Date(), voidedById: userId, voidReason: reason });
    });
    return this.findOne(id, instituteId);
  }

  async findOne(id: string, instituteId: string) {
    const payment = await this.dataSource.getRepository(Payment).findOne({
      where: { id, instituteId },
      relations: ['allocations', 'allocations.fee', 'student', 'student.user', 'student.guardian', 'receivedBy', 'institute'],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async findAll(instituteId: string, query: PaymentsQueryDto) {
    assertDateOrder(query.from, query.to, 'Date range');
    const qb = this.dataSource
      .getRepository(Payment)
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('payment.receivedBy', 'receivedBy')
      .where('payment.instituteId = :instituteId', { instituteId })
      .orderBy('payment.paidAt', 'DESC')
      .addOrderBy('payment.createdAt', 'DESC')
      .take(500);
    if (query.from) qb.andWhere('payment.paidAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('payment.paidAt <= :to', { to: query.to });
    if (query.method) qb.andWhere('payment.method = :method', { method: query.method });
    if (query.studentId) qb.andWhere('payment.studentId = :studentId', { studentId: query.studentId });
    if (query.includeVoided !== 'true') qb.andWhere('payment.voidedAt IS NULL');
    return qb.getMany();
  }

  private async lockPayableFees(manager: EntityManager, instituteId: string, studentId: string) {
    const fees = await manager
      .getRepository(StudentFee)
      .createQueryBuilder('fee')
      .setLock('pessimistic_write')
      .where('fee.instituteId = :instituteId AND fee.studentId = :studentId', { instituteId, studentId })
      .andWhere(new Brackets((w) => w.where('fee.status IN (:...open)', { open: [FeeStatus.UNPAID, FeeStatus.PARTIAL] })))
      .orderBy('fee.id') // lock rows in a fixed order; allocation order is decided below
      .getMany();
    // Oldest first: due date; on the same date a monthly fee before a one-off fee
    // (institute decision), then earlier billing month, then creation time.
    return fees.sort(
      (a, b) =>
        (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
        Number(b.type === FeeType.MONTHLY) - Number(a.type === FeeType.MONTHLY) ||
        (a.period ?? '').localeCompare(b.period ?? '') ||
        a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  private oldestFirstPlan(fees: StudentFee[], amountPaisa: number) {
    const totalDue = fees.reduce((sum, f) => sum + feeDuePaisa(f), 0);
    if (totalDue === 0) throw new BadRequestException('This student has no dues to pay');
    if (amountPaisa > totalDue) {
      throw new BadRequestException(`Amount is more than the total due of ৳${fromPaisa(totalDue)}`);
    }
    const plan: { fee: StudentFee; paisa: number }[] = [];
    let remaining = amountPaisa;
    for (const fee of fees) {
      if (remaining === 0) break;
      const paisa = Math.min(feeDuePaisa(fee), remaining);
      if (paisa > 0) {
        plan.push({ fee, paisa });
        remaining -= paisa;
      }
    }
    return plan;
  }

  private explicitPlan(fees: StudentFee[], dto: CreatePaymentDto) {
    const byId = new Map(fees.map((f) => [f.id, f]));
    const seen = new Set<string>();
    const plan = dto.allocations!.map(({ feeId, amount }) => {
      const fee = byId.get(feeId);
      if (!fee) throw new BadRequestException(`Fee ${feeId} is not an open fee of this student`);
      if (seen.has(feeId)) throw new BadRequestException(`Fee ${feeId} is listed twice`);
      seen.add(feeId);
      const paisa = toPaisa(amount);
      if (paisa > feeDuePaisa(fee)) {
        throw new BadRequestException(`"${fee.title}" has only ৳${fromPaisa(feeDuePaisa(fee))} due`);
      }
      return { fee, paisa };
    });
    const total = plan.reduce((sum, p) => sum + p.paisa, 0);
    if (total !== toPaisa(dto.amount)) {
      throw new BadRequestException(`Allocations add up to ৳${fromPaisa(total)}, but the payment is ৳${dto.amount}`);
    }
    return plan;
  }
}
