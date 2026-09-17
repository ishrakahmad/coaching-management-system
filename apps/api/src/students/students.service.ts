import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student } from './entities/student.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { GuardiansService } from '../guardians/guardians.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { EnrollmentStatus } from '../enrollments/entities/enrollment.entity';
import { IdCounterService } from '../common/id-counter/id-counter.service';
import { Role } from '../users/enums/role.enum';
import { CreateStudentDto, UpdateStudentDto } from './dto/create-student.dto';
import { pickDefined } from '../common/utils/pick-defined';
import { FeesService } from '../fees/fees.service';
import { FeeStatus, FeeType, StudentFee } from '../fees/entities/student-fee.entity';
import { currentPeriod } from '../common/utils/period';
import { todayInDhaka } from '../common/utils/dates';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private repo: Repository<Student>,
    @InjectDataSource()
    private dataSource: DataSource,
    private usersService: UsersService,
    private guardiansService: GuardiansService,
    private enrollmentsService: EnrollmentsService,
    private idCounter: IdCounterService,
    private feesService: FeesService,
  ) {}

  /** List view: each student with guardian and *active* batches only. */
  async findAll(instituteId: string) {
    const students = await this.repo.find({
      where: { instituteId },
      relations: ['user', 'guardian', 'enrollments', 'enrollments.batch'],
      order: { studentId: 'ASC' },
    });
    for (const student of students) {
      student.enrollments = student.enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE);
    }
    return students;
  }

  /** Detail view: full enrollment history. */
  async findOne(id: string, instituteId: string) {
    const student = await this.repo.findOne({
      where: { id, instituteId },
      relations: ['user', 'guardian', 'enrollments', 'enrollments.batch'],
      order: { enrollments: { enrolledAt: 'DESC' } },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  /**
   * STD-<year>-<seq>, sequence per institute per year, never reused.
   * A new counter starts after any IDs already issued that year (including
   * soft-deleted students), so databases created before this change stay safe.
   */
  private async generateStudentId(manager: EntityManager, instituteId: string) {
    const year = new Date().getFullYear();
    const prefix = `STD-${year}-`;
    const [{ max }] = await manager.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING("studentId" FROM $2) AS INTEGER)), 0) AS max
       FROM students WHERE institute_id = $1 AND "studentId" LIKE $3`,
      [instituteId, prefix.length + 1, `${prefix}%`],
    );
    const seq = await this.idCounter.next(manager, instituteId, `student-${year}`, Number(max));
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  async create(instituteId: string, dto: CreateStudentDto, userId?: string) {
    if (dto.guardianId && dto.guardian) {
      throw new BadRequestException('Send either guardianId or guardian, not both');
    }
    if (await this.usersService.findByEmail(dto.email)) {
      throw new ConflictException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // User, guardian, student, enrollments and the ID counter change together: all or nothing.
    const studentId = await this.dataSource.transaction(async (manager) => {
      const guardian = dto.guardianId
        ? await this.guardiansService.findOrFail(dto.guardianId, instituteId, manager).catch(() => {
            throw new BadRequestException(`Unknown guardianId: ${dto.guardianId}`);
          })
        : dto.guardian
          ? await this.guardiansService.findOrCreate(manager, instituteId, dto.guardian)
          : null;

      const user = await manager.save(
        manager.create(User, {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          password: hashedPassword,
          role: Role.STUDENT,
          instituteId,
        }),
      );
      const student = await manager.save(
        manager.create(Student, {
          userId: user.id,
          instituteId,
          studentId: await this.generateStudentId(manager, instituteId),
          guardianId: guardian?.id ?? null,
          guardianRelation: guardian ? (dto.guardianRelation ?? null) : null,
          address: dto.address,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        }),
      );
      await this.enrollmentsService.enrollMany(manager, instituteId, student.id, dto.batchIds);
      if (dto.admissionFee) {
        await manager.insert(StudentFee, {
          instituteId,
          studentId: student.id,
          type: FeeType.ADMISSION,
          title: 'Admission fee',
          amount: dto.admissionFee,
          dueDate: todayInDhaka(),
          status: FeeStatus.UNPAID,
          createdById: userId ?? null,
        });
      }
      if (dto.billCurrentMonth && dto.batchIds?.length) {
        await this.feesService.generateMonthly(instituteId, currentPeriod(), { studentId: student.id, userId, manager });
      }
      return student.id;
    });
    return this.findOne(studentId, instituteId);
  }

  async update(id: string, instituteId: string, dto: UpdateStudentDto) {
    const student = await this.findOne(id, instituteId);
    const { fullName, phone, dateOfBirth, guardianId, ...profile } = dto;

    await this.dataSource.transaction(async (manager) => {
      const userChanges = pickDefined({ fullName, phone });
      if (Object.keys(userChanges).length) {
        await manager.update(User, { id: student.userId }, userChanges);
      }

      const studentChanges: Partial<Student> = pickDefined({ ...profile });
      if (dateOfBirth !== undefined) studentChanges.dateOfBirth = new Date(dateOfBirth);
      if (guardianId !== undefined) {
        if (guardianId) {
          await this.guardiansService.findOrFail(guardianId, instituteId, manager).catch(() => {
            throw new BadRequestException(`Unknown guardianId: ${guardianId}`);
          });
        } else {
          studentChanges.guardianRelation = null; // unlinking also clears the relation
        }
        studentChanges.guardianId = guardianId;
      }
      if (Object.keys(studentChanges).length) {
        await manager.update(Student, { id }, studentChanges);
      }
    });
    return this.findOne(id, instituteId);
  }

  async remove(id: string, instituteId: string) {
    const student = await this.findOne(id, instituteId);
    await this.dataSource.transaction(async (manager) => {
      await this.enrollmentsService.closeAllForStudent(manager, student.id);
      await manager.softDelete(Student, { id: student.id });
      await manager.softDelete(User, { id: student.userId });
    });
    return { id, deleted: true };
  }
}
