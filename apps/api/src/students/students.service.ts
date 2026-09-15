import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student } from './entities/student.entity';
import { Batch } from '../batches/entities/batch.entity';
import { UsersService } from '../users/users.service';
import { Role } from '../users/enums/role.enum';
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private repo: Repository<Student>,
    @InjectRepository(Batch)
    private batchRepo: Repository<Batch>,
    private usersService: UsersService,
  ) {}

  findAll(instituteId: string) {
    return this.repo.find({ where: { instituteId }, relations: ['user', 'batches'] });
  }

  async findOne(id: string) {
    const student = await this.repo.findOne({ where: { id }, relations: ['user', 'batches'] });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  private async generateStudentId(instituteId: string) {
    const year = new Date().getFullYear();
    const count = await this.repo.count({ where: { instituteId } });
    return `STD-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(instituteId: string, dto: CreateStudentDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      role: Role.STUDENT,
      instituteId,
    });

    const batches = dto.batchIds?.length
      ? await this.batchRepo.find({ where: { id: In(dto.batchIds) } })
      : [];

    const student = this.repo.create({
      userId: user.id,
      instituteId,
      studentId: await this.generateStudentId(instituteId),
      guardianName: dto.guardianName,
      guardianPhone: dto.guardianPhone,
      address: dto.address,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      batches,
    });
    return this.repo.save(student);
  }

  async update(id: string, data: Partial<Student>) {
    const student = await this.findOne(id);
    Object.assign(student, data);
    return this.repo.save(student);
  }

  async remove(id: string) {
    const student = await this.findOne(id);
    return this.repo.softRemove(student);
  }
}
