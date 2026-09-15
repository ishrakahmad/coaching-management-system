import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private repo: Repository<Subject>,
  ) {}

  findAll(instituteId: string) {
    return this.repo.find({ where: { instituteId } });
  }

  async findOne(id: string) {
    const subject = await this.repo.findOne({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  create(instituteId: string, dto: CreateSubjectDto) {
    return this.repo.save(this.repo.create({ ...dto, instituteId }));
  }

  async update(id: string, dto: Partial<CreateSubjectDto>) {
    const subject = await this.findOne(id);
    Object.assign(subject, dto);
    return this.repo.save(subject);
  }

  async remove(id: string) {
    const subject = await this.findOne(id);
    return this.repo.softRemove(subject);
  }
}
