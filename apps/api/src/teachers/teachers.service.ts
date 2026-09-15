import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Teacher } from './entities/teacher.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { UsersService } from '../users/users.service';
import { Role } from '../users/enums/role.enum';
import { CreateTeacherDto } from './dto/create-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private repo: Repository<Teacher>,
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
    private usersService: UsersService,
  ) {}

  findAll(instituteId: string) {
    return this.repo.find({ where: { instituteId }, relations: ['user', 'subjects'] });
  }

  async findOne(id: string) {
    const teacher = await this.repo.findOne({ where: { id }, relations: ['user', 'subjects'] });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  async create(instituteId: string, dto: CreateTeacherDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      role: Role.TEACHER,
      instituteId,
    });

    const subjects = dto.subjectIds?.length
      ? await this.subjectRepo.find({ where: { id: In(dto.subjectIds) } })
      : [];

    const teacher = this.repo.create({
      userId: user.id,
      instituteId,
      designation: dto.designation,
      qualification: dto.qualification,
      monthlySalary: dto.monthlySalary,
      subjects,
    });
    return this.repo.save(teacher);
  }

  async update(id: string, data: Partial<Teacher>) {
    const teacher = await this.findOne(id);
    Object.assign(teacher, data);
    return this.repo.save(teacher);
  }

  async remove(id: string) {
    const teacher = await this.findOne(id);
    return this.repo.softRemove(teacher);
  }
}
