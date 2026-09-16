import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AcademicSession } from './entities/academic-session.entity';
import { Batch } from '../batches/entities/batch.entity';
import { CreateAcademicSessionDto, UpdateAcademicSessionDto } from './dto/academic-session.dto';
import { assertDateOrder } from '../common/utils/dates';
import { pickDefined } from '../common/utils/pick-defined';

@Injectable()
export class AcademicSessionsService {
  constructor(
    @InjectRepository(AcademicSession)
    private repo: Repository<AcademicSession>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  findAll(instituteId: string) {
    return this.repo
      .createQueryBuilder('s')
      .where('s.instituteId = :instituteId', { instituteId })
      .orderBy('s.isCurrent', 'DESC')
      .addOrderBy('s.startDate', 'DESC', 'NULLS LAST')
      .addOrderBy('s.name', 'DESC')
      .getMany();
  }

  async findCurrent(instituteId: string) {
    const session = await this.repo.findOne({ where: { instituteId, isCurrent: true } });
    if (!session) throw new NotFoundException('No current session is set');
    return session;
  }

  async findOne(id: string, instituteId: string) {
    const session = await this.repo.findOne({ where: { id, instituteId } });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  /** For other modules: 400 (not 404) when a referenced session isn't in this institute. */
  async assertBelongs(id: string | null | undefined, instituteId: string, manager?: EntityManager) {
    if (!id) return;
    const repo = manager ? manager.getRepository(AcademicSession) : this.repo;
    if (!(await repo.exists({ where: { id, instituteId } }))) {
      throw new BadRequestException(`Unknown sessionId: ${id}`);
    }
  }

  async create(instituteId: string, dto: CreateAcademicSessionDto) {
    assertDateOrder(dto.startDate, dto.endDate, 'Session');
    const id = await this.dataSource.transaction(async (manager) => {
      if (dto.isCurrent) await this.clearCurrent(manager, instituteId);
      const saved = await manager.save(manager.create(AcademicSession, { ...dto, instituteId }));
      return saved.id;
    });
    return this.findOne(id, instituteId);
  }

  async update(id: string, instituteId: string, dto: UpdateAcademicSessionDto) {
    const session = await this.findOne(id, instituteId);
    assertDateOrder(dto.startDate ?? session.startDate, dto.endDate ?? session.endDate, 'Session');
    if (dto.isCurrent && (dto.isActive === false || (dto.isActive === undefined && !session.isActive))) {
      throw new BadRequestException('An inactive session cannot be the current session');
    }
    await this.dataSource.transaction(async (manager) => {
      if (dto.isCurrent && !session.isCurrent) await this.clearCurrent(manager, instituteId);
      const changes = pickDefined({ ...dto });
      // Deactivating the current session also un-marks it.
      if (dto.isActive === false) changes.isCurrent = false;
      await manager.update(AcademicSession, { id }, changes);
    });
    return this.findOne(id, instituteId);
  }

  async remove(id: string, instituteId: string) {
    const session = await this.findOne(id, instituteId);
    const batchCount = await this.dataSource.getRepository(Batch).count({ where: { sessionId: id } });
    if (batchCount) {
      throw new ConflictException(`Session is used by ${batchCount} batch(es). Move or delete them first, or mark the session inactive.`);
    }
    await this.repo.update({ id }, { isCurrent: false });
    await this.repo.softDelete({ id: session.id });
    return { id, deleted: true };
  }

  private clearCurrent(manager: EntityManager, instituteId: string) {
    return manager.update(AcademicSession, { instituteId, isCurrent: true }, { isCurrent: false });
  }
}
