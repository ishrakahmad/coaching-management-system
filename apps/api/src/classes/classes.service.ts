import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AcademicClass } from './entities/academic-class.entity';
import { Batch } from '../batches/entities/batch.entity';
import { CreateAcademicClassDto, UpdateAcademicClassDto } from './dto/academic-class.dto';
import { pickDefined } from '../common/utils/pick-defined';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(AcademicClass)
    private repo: Repository<AcademicClass>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  findAll(instituteId: string) {
    return this.repo.find({ where: { instituteId }, order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async findOne(id: string, instituteId: string) {
    const academicClass = await this.repo.findOne({ where: { id, instituteId } });
    if (!academicClass) throw new NotFoundException('Class not found');
    return academicClass;
  }

  async assertBelongs(id: string | null | undefined, instituteId: string, manager?: EntityManager) {
    if (!id) return;
    const repo = manager ? manager.getRepository(AcademicClass) : this.repo;
    if (!(await repo.exists({ where: { id, instituteId } }))) {
      throw new BadRequestException(`Unknown classId: ${id}`);
    }
  }

  create(instituteId: string, dto: CreateAcademicClassDto) {
    return this.repo.save(this.repo.create({ ...dto, instituteId }));
  }

  async update(id: string, instituteId: string, dto: UpdateAcademicClassDto) {
    const academicClass = await this.findOne(id, instituteId);
    Object.assign(academicClass, pickDefined({ ...dto }));
    return this.repo.save(academicClass);
  }

  async remove(id: string, instituteId: string) {
    await this.findOne(id, instituteId);
    const batchCount = await this.dataSource.getRepository(Batch).count({ where: { classId: id } });
    if (batchCount) {
      throw new ConflictException(`Class is used by ${batchCount} batch(es). Move or delete them first, or mark the class inactive.`);
    }
    await this.repo.softDelete({ id });
    return { id, deleted: true };
  }
}
