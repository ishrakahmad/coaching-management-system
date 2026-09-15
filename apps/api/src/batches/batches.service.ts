import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Batch } from './entities/batch.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { CreateBatchDto } from './dto/create-batch.dto';

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(Batch)
    private repo: Repository<Batch>,
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
  ) {}

  findAll(instituteId: string) {
    return this.repo.find({ where: { instituteId }, relations: ['leadTeacher', 'subjects'] });
  }

  async findOne(id: string) {
    const batch = await this.repo.findOne({ where: { id }, relations: ['leadTeacher', 'subjects'] });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  async create(instituteId: string, dto: CreateBatchDto) {
    const subjects = dto.subjectIds?.length
      ? await this.subjectRepo.find({ where: { id: In(dto.subjectIds) } })
      : [];
    const batch = this.repo.create({
      name: dto.name,
      session: dto.session,
      monthlyFee: dto.monthlyFee ?? 0,
      schedule: dto.schedule,
      leadTeacherId: dto.leadTeacherId,
      instituteId,
      subjects,
    });
    return this.repo.save(batch);
  }

  async update(id: string, dto: Partial<CreateBatchDto>) {
    const batch = await this.findOne(id);
    if (dto.subjectIds) {
      batch.subjects = await this.subjectRepo.find({ where: { id: In(dto.subjectIds) } });
    }
    Object.assign(batch, { ...dto, subjectIds: undefined });
    return this.repo.save(batch);
  }

  async remove(id: string) {
    const batch = await this.findOne(id);
    return this.repo.softRemove(batch);
  }
}
