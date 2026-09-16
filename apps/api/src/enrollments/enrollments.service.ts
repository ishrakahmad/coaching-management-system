import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { Batch } from '../batches/entities/batch.entity';
import { Student } from '../students/entities/student.entity';
import { CreateEnrollmentDto, LeaveEnrollmentDto, UpdateEnrollmentDto } from './dto/enrollment.dto';
import { assertDateOrder, todayInDhaka } from '../common/utils/dates';
import { assertAllFound } from '../common/utils/assert-all-found';
import { pickDefined } from '../common/utils/pick-defined';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private repo: Repository<Enrollment>,
    @InjectDataSource()
    private dataSource: DataSource,
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

  async enroll(studentId: string, instituteId: string, dto: CreateEnrollmentDto) {
    const id = await this.dataSource.transaction(async (manager) => {
      await this.assertStudent(studentId, instituteId, manager);
      const [enrollment] = await this.enrollMany(manager, instituteId, studentId, [dto.batchId], dto);
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

  async leave(id: string, instituteId: string, dto: LeaveEnrollmentDto) {
    const enrollment = await this.findOne(id, instituteId);
    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new ConflictException('Student has already left this batch');
    }
    const leftAt = dto.leftAt ?? todayInDhaka();
    assertDateOrder(enrollment.enrolledAt, leftAt, 'Enrollment');
    await this.repo.update({ id }, { status: EnrollmentStatus.LEFT, leftAt });
    return this.findOne(id, instituteId);
  }

  /** When a student is deleted, their active enrollments end on that day. */
  closeAllForStudent(manager: EntityManager, studentId: string) {
    return manager
      .createQueryBuilder()
      .update(Enrollment)
      .set({ status: EnrollmentStatus.LEFT, leftAt: () => `GREATEST(CURRENT_DATE, "enrolledAt")` })
      .where('student_id = :studentId AND status = :status', { studentId, status: EnrollmentStatus.ACTIVE })
      .execute();
  }

  private async assertStudent(studentId: string, instituteId: string, manager?: EntityManager) {
    const repo = (manager ?? this.dataSource.manager).getRepository(Student);
    if (!(await repo.exists({ where: { id: studentId, instituteId } }))) {
      throw new NotFoundException('Student not found');
    }
  }
}
