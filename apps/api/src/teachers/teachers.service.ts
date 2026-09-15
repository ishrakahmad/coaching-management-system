import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Teacher } from './entities/teacher.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { SubjectsService } from '../subjects/subjects.service';
import { Role } from '../users/enums/role.enum';
import { CreateTeacherDto, UpdateTeacherDto } from './dto/create-teacher.dto';
import { pickDefined } from '../common/utils/pick-defined';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private repo: Repository<Teacher>,
    @InjectDataSource()
    private dataSource: DataSource,
    private usersService: UsersService,
    private subjectsService: SubjectsService,
  ) {}

  findAll(instituteId: string) {
    return this.repo.find({ where: { instituteId }, relations: ['user', 'subjects'] });
  }

  async findOne(id: string, instituteId: string) {
    const teacher = await this.repo.findOne({ where: { id, instituteId }, relations: ['user', 'subjects'] });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  async exists(id: string, instituteId: string) {
    return this.repo.exists({ where: { id, instituteId } });
  }

  async create(instituteId: string, dto: CreateTeacherDto) {
    if (await this.usersService.findByEmail(dto.email)) {
      throw new ConflictException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // User + Teacher are saved together: if either insert fails, neither is kept.
    const teacherId = await this.dataSource.transaction(async (manager) => {
      const subjects = await this.subjectsService.findManyForInstitute(dto.subjectIds, instituteId, manager);
      const user = await manager.save(
        manager.create(User, {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          password: hashedPassword,
          role: Role.TEACHER,
          instituteId,
        }),
      );
      const teacher = await manager.save(
        manager.create(Teacher, {
          userId: user.id,
          instituteId,
          designation: dto.designation,
          qualification: dto.qualification,
          monthlySalary: dto.monthlySalary,
          subjects,
        }),
      );
      return teacher.id;
    });
    return this.findOne(teacherId, instituteId);
  }

  async update(id: string, instituteId: string, dto: UpdateTeacherDto) {
    const teacher = await this.findOne(id, instituteId);
    const { fullName, phone, subjectIds, isActive, ...profile } = dto;

    await this.dataSource.transaction(async (manager) => {
      // Deactivating a teacher also blocks their login.
      const userChanges = pickDefined({ fullName, phone, isActive });
      if (Object.keys(userChanges).length) {
        await manager.update(User, { id: teacher.userId }, userChanges);
      }
      Object.assign(teacher, pickDefined({ ...profile, isActive }));
      if (subjectIds) {
        teacher.subjects = await this.subjectsService.findManyForInstitute(subjectIds, instituteId, manager);
      }
      const { user: _user, ...teacherWithoutUser } = teacher;
      await manager.save(Teacher, teacherWithoutUser);
    });
    return this.findOne(id, instituteId);
  }

  async remove(id: string, instituteId: string) {
    const teacher = await this.findOne(id, instituteId);
    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Teacher, { id: teacher.id });
      await manager.softDelete(User, { id: teacher.userId });
    });
    return { id, deleted: true };
  }
}
