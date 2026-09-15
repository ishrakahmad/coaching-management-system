import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/create-subject.dto';
import { assertAllFound } from '../common/utils/assert-all-found';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private repo: Repository<Subject>,
  ) {}

  findAll(instituteId: string) {
    return this.repo.find({ where: { instituteId }, order: { name: 'ASC' } });
  }

  async findOne(id: string, instituteId: string) {
    const subject = await this.repo.findOne({ where: { id, instituteId } });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  /** Loads subjects by ID, rejecting any that don't exist in this institute. */
  async findManyForInstitute(ids: string[] | undefined, instituteId: string, manager?: EntityManager) {
    if (!ids?.length) return [];
    const repo = manager ? manager.getRepository(Subject) : this.repo;
    const subjects = await repo.find({ where: { id: In(ids), instituteId } });
    assertAllFound(subjects, ids, 'subjectIds');
    return subjects;
  }

  create(instituteId: string, dto: CreateSubjectDto) {
    return this.repo.save(this.repo.create({ ...dto, instituteId }));
  }

  async update(id: string, instituteId: string, dto: UpdateSubjectDto) {
    const subject = await this.findOne(id, instituteId);
    Object.assign(subject, dto);
    return this.repo.save(subject);
  }

  async remove(id: string, instituteId: string) {
    const subject = await this.findOne(id, instituteId);
    return this.repo.softRemove(subject);
  }
}
