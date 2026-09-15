import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student } from './entities/student.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { BatchesService } from '../batches/batches.service';
import { IdCounterService } from '../common/id-counter/id-counter.service';
import { Role } from '../users/enums/role.enum';
import { CreateStudentDto, UpdateStudentDto } from './dto/create-student.dto';
import { pickDefined } from '../common/utils/pick-defined';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private repo: Repository<Student>,
    @InjectDataSource()
    private dataSource: DataSource,
    private usersService: UsersService,
    private batchesService: BatchesService,
    private idCounter: IdCounterService,
  ) {}

  findAll(instituteId: string) {
    return this.repo.find({ where: { instituteId }, relations: ['user', 'batches'] });
  }

  async findOne(id: string, instituteId: string) {
    const student = await this.repo.findOne({ where: { id, instituteId }, relations: ['user', 'batches'] });
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

  async create(instituteId: string, dto: CreateStudentDto) {
    if (await this.usersService.findByEmail(dto.email)) {
      throw new ConflictException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // User + Student + ID counter change together: all or nothing.
    const studentId = await this.dataSource.transaction(async (manager) => {
      const batches = await this.batchesService.findManyForInstitute(dto.batchIds, instituteId, manager);
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
          guardianName: dto.guardianName,
          guardianPhone: dto.guardianPhone,
          address: dto.address,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          batches,
        }),
      );
      return student.id;
    });
    return this.findOne(studentId, instituteId);
  }

  async update(id: string, instituteId: string, dto: UpdateStudentDto) {
    const student = await this.findOne(id, instituteId);
    const { fullName, phone, batchIds, dateOfBirth, ...profile } = dto;

    await this.dataSource.transaction(async (manager) => {
      const userChanges = pickDefined({ fullName, phone });
      if (Object.keys(userChanges).length) {
        await manager.update(User, { id: student.userId }, userChanges);
      }
      Object.assign(student, pickDefined(profile));
      if (dateOfBirth !== undefined) student.dateOfBirth = new Date(dateOfBirth);
      if (batchIds) {
        student.batches = await this.batchesService.findManyForInstitute(batchIds, instituteId, manager);
      }
      const { user: _user, ...studentWithoutUser } = student;
      await manager.save(Student, studentWithoutUser);
    });
    return this.findOne(id, instituteId);
  }

  async remove(id: string, instituteId: string) {
    const student = await this.findOne(id, instituteId);
    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Student, { id: student.id });
      await manager.softDelete(User, { id: student.userId });
    });
    return { id, deleted: true };
  }
}
