import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { FeeStatus, FeeType, StudentFee } from '../fees/entities/student-fee.entity';
import { Batch } from '../batches/entities/batch.entity';
import { Student } from '../students/entities/student.entity';
import { CreateEnrollmentDto, LeaveEnrollmentDto, UpdateEnrollmentDto } from './dto/enrollment.dto';
import { assertDateOrder, todayInDhaka } from '../common/utils/dates';
import { FeesService } from '../fees/fees.service';
import { currentPeriod } from '../common/utils/period';
import { assertAllFound } from '../common/utils/assert-all-found';
import { pickDefined } from '../common/utils/pick-defined';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private repo: Repository<Enrollment>,
    @InjectDataSource()
    private dataSource: DataSource,
    private feesService: FeesService,
  ) {}

  async findForStudent(studentId: string, instituteId: string) {
    await this.assertStudent(studentId, instituteId);
    return this.repo.find({
      where: { studentId, instituteId },
      relations: ['batch'],
      order: { status: 'ASC', enrolledAt: 'DESC' },
    });
  }

  /** Batch roster. By default only active students; pass includeLeft for history. */
  async findForBatch(batchId: string, instituteId: string, includeLeft = false) {
    const batch = await this.dataSource.getRepository(Batch).findOne({ where: { id: batchId, instituteId } });
    if (!batch) throw new NotFoundException('Batch not found');
    return this.repo.find({
      where: { batchId, instituteId, ...(includeLeft ? {} : { status: EnrollmentStatus.ACTIVE }) },
      relations: ['student', 'student.user'],
      order: { enrolledAt: 'ASC' },
    });
  }

  async enroll(studentId: string, instituteId: string, dto: CreateEnrollmentDto, userId?: string) {
    const id = await this.dataSource.transaction(async (manager) => {
      await this.assertStudent(studentId, instituteId, manager);
      const [enrollment] = await this.enrollMany(manager, instituteId, studentId, [dto.batchId], dto);
      if (dto.billCurrentMonth) {
        await this.feesService.generateMonthly(instituteId, currentPeriod(), { batchId: dto.batchId, studentId, userId, manager });
      }
      return enrollment.id;
    });
    return this.findOne(id, instituteId);
  }

  /** Shared by single enrollment and admission (student create). Runs inside the caller's transaction. */
  async enrollMany(
    manager: EntityManager,
    instituteId: string,
    studentId: string,
    batchIds: string[] | undefined,
    options: { enrolledAt?: string; feeOverride?: number | null } = {},
  ) {
    const ids = [...new Set(batchIds ?? [])];
    if (!ids.length) return [];

    const batches = await manager.find(Batch, { where: { id: In(ids), instituteId } });
    assertAllFound(batches, ids, 'batchIds');
    const inactive = batches.filter((b) => !b.isActive);
    if (inactive.length) {
      throw new BadRequestException(`Batch is inactive: ${inactive.map((b) => b.name).join(', ')}`);
    }

    const alreadyActive = await manager.find(Enrollment, {
      where: { studentId, batchId: In(ids), status: EnrollmentStatus.ACTIVE },
      relations: ['batch'],
    });
    if (alreadyActive.length) {
      throw new ConflictException(`Student is already enrolled in: ${alreadyActive.map((e) => e.batch.name).join(', ')}`);
    }

    return manager.save(
      ids.map((batchId) =>
        manager.create(Enrollment, {
          studentId,
          batchId,
          instituteId,
          enrolledAt: options.enrolledAt ?? todayInDhaka(),
          feeOverride: options.feeOverride ?? null,
          status: EnrollmentStatus.ACTIVE,
        }),
      ),
    );
  }

  async findOne(id: string, instituteId: string) {
    const enrollment = await this.repo.findOne({ where: { id, instituteId }, relations: ['batch', 'student', 'student.user'] });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async update(id: string, instituteId: string, dto: UpdateEnrollmentDto) {
    const enrollment = await this.findOne(id, instituteId);
    assertDateOrder(dto.enrolledAt ?? enrollment.enrolledAt, enrollment.leftAt, 'Enrollment');
    const changes = pickDefined({ ...dto });
    if (Object.keys(changes).length) await this.repo.update({ id }, changes);
    return this.findOne(id, instituteId);
  }

  /**
   * Ends an enrollment. Unpaid monthly fees for months *after* the leaving month
   * (e.g. generated in advance) are waived automatically; the leaving month itself stays billed.
   */
  async leave(id: string, instituteId: string, dto: LeaveEnrollmentDto) {
    const enrollment = await this.findOne(id, instituteId);
    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new ConflictException('Student has already left this batch');
    }
    const leftAt = dto.leftAt ?? todayInDhaka();
    assertDateOrder(enrollment.enrolledAt, leftAt, 'Enrollment');
    const waivedFeeCount = await this.dataSource.transaction(async (manager) => {
      await manager.update(Enrollment, { id }, { status: EnrollmentStatus.LEFT, leftAt });
      return this.waiveFeesAfter(manager, [id], leftAt);
    });
    return Object.assign(await this.findOne(id, instituteId), { waivedFeeCount });
  }

  private async waiveFeesAfter(manager: EntityManager, enrollmentIds: string[], leftAt: string) {
    if (!enrollmentIds.length) return 0;
    const result = await manager
      .createQueryBuilder()
      .update(StudentFee)
      .set({ status: FeeStatus.WAIVED, waivedReason: `Left the batch on ${leftAt}` })
      .where('enrollment_id IN (:...enrollmentIds)', { enrollmentIds })
      .andWhere('type = :monthly AND status = :unpaid AND "paidAmount" = 0', { monthly: FeeType.MONTHLY, unpaid: FeeStatus.UNPAID })
      .andWhere('period > :leftMonth', { leftMonth: leftAt.slice(0, 7) })
      .execute();
    return result.affected ?? 0;
  }

  /** When a student is deleted, their active enrollments end today and later unpaid monthly fees are waived. */
  async closeAllForStudent(manager: EntityManager, studentId: string) {
    const today = todayInDhaka();
    const active = await manager.find(Enrollment, { where: { studentId, status: EnrollmentStatus.ACTIVE } });
    for (const enrollment of active) {
      const leftAt = enrollment.enrolledAt > today ? enrollment.enrolledAt : today;
      await manager.update(Enrollment, { id: enrollment.id }, { status: EnrollmentStatus.LEFT, leftAt });
      await this.waiveFeesAfter(manager, [enrollment.id], leftAt);
    }
  }

  private async assertStudent(studentId: string, instituteId: string, manager?: EntityManager) {
    const repo = (manager ?? this.dataSource.manager).getRepository(Student);
    if (!(await repo.exists({ where: { id: studentId, instituteId } }))) {
      throw new NotFoundException('Student not found');
    }
  }
}
