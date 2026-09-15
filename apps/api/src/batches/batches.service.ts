import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Batch } from './entities/batch.entity';
import { CreateBatchDto, UpdateBatchDto } from './dto/create-batch.dto';
import { SubjectsService } from '../subjects/subjects.service';
import { TeachersService } from '../teachers/teachers.service';
import { assertAllFound } from '../common/utils/assert-all-found';
import { pickDefined } from '../common/utils/pick-defined';

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(Batch)
    private repo: Repository<Batch>,
    private subjectsService: SubjectsService,
    private teachersService: TeachersService,
  ) {}

  findAll(instituteId: string) {
    return this.repo.find({ where: { instituteId }, relations: ['leadTeacher', 'subjects'] });
  }

  async findOne(id: string, instituteId: string) {
    const batch = await this.repo.findOne({ where: { id, instituteId }, relations: ['leadTeacher', 'subjects'] });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  /** Loads batches by ID, rejecting any that don't exist in this institute. */
  async findManyForInstitute(ids: string[] | undefined, instituteId: string, manager?: EntityManager) {
    if (!ids?.length) return [];
    const repo = manager ? manager.getRepository(Batch) : this.repo;
    const batches = await repo.find({ where: { id: In(ids), instituteId } });
    assertAllFound(batches, ids, 'batchIds');
    return batches;
  }

  private async assertTeacher(leadTeacherId: string | null | undefined, instituteId: string) {
    if (leadTeacherId && !(await this.teachersService.exists(leadTeacherId, instituteId))) {
      throw new BadRequestException(`Unknown leadTeacherId: ${leadTeacherId}`);
    }
  }

  async create(instituteId: string, dto: CreateBatchDto) {
    await this.assertTeacher(dto.leadTeacherId, instituteId);
    const subjects = await this.subjectsService.findManyForInstitute(dto.subjectIds, instituteId);
    const batch = await this.repo.save(
      this.repo.create({
        name: dto.name,
        session: dto.session,
        monthlyFee: dto.monthlyFee ?? 0,
        schedule: dto.schedule,
        leadTeacherId: dto.leadTeacherId ?? undefined,
        instituteId,
        subjects,
      }),
    );
    return this.findOne(batch.id, instituteId);
  }

  async update(id: string, instituteId: string, dto: UpdateBatchDto) {
    const batch = await this.findOne(id, instituteId);
    await this.assertTeacher(dto.leadTeacherId, instituteId);

    const { subjectIds, leadTeacherId, ...fields } = dto;
    Object.assign(batch, pickDefined(fields));
    if (leadTeacherId !== undefined) {
      batch.leadTeacherId = leadTeacherId as string;
      batch.leadTeacher = undefined as any; // let the FK column drive the relation
    }
    if (subjectIds) {
      batch.subjects = await this.subjectsService.findManyForInstitute(subjectIds, instituteId);
    }
    await this.repo.save(batch);
    return this.findOne(id, instituteId);
  }

  async remove(id: string, instituteId: string) {
    const batch = await this.findOne(id, instituteId);
    await this.repo.softRemove(batch);
    return { id, deleted: true };
  }
}
