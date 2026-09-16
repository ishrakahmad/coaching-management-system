import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from './entities/batch.entity';
import { BatchQueryDto, CreateBatchDto, UpdateBatchDto } from './dto/create-batch.dto';
import { SubjectsService } from '../subjects/subjects.service';
import { TeachersService } from '../teachers/teachers.service';
import { AcademicSessionsService } from '../academic-sessions/academic-sessions.service';
import { ClassesService } from '../classes/classes.service';
import { EnrollmentStatus } from '../enrollments/entities/enrollment.entity';
import { pickDefined } from '../common/utils/pick-defined';

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(Batch)
    private repo: Repository<Batch>,
    private subjectsService: SubjectsService,
    private teachersService: TeachersService,
    private sessionsService: AcademicSessionsService,
    private classesService: ClassesService,
  ) {}

  private baseQuery(instituteId: string) {
    return this.repo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.academicSession', 'academicSession')
      .leftJoinAndSelect('batch.academicClass', 'academicClass')
      .leftJoinAndSelect('batch.subjects', 'subjects')
      .leftJoin('batch.leadTeacher', 'leadTeacher')
      .leftJoin('leadTeacher.user', 'leadTeacherUser')
      // Only public teacher fields: batches are visible to every role, salaries are not.
      .addSelect(['leadTeacher.id', 'leadTeacher.designation', 'leadTeacherUser.id', 'leadTeacherUser.fullName'])
      .loadRelationCountAndMap('batch.activeStudentCount', 'batch.enrollments', 'enrollment', (qb) =>
        qb.andWhere('enrollment.status = :active', { active: EnrollmentStatus.ACTIVE }),
      )
      .where('batch.instituteId = :instituteId', { instituteId });
  }

  findAll(instituteId: string, query: BatchQueryDto = {}) {
    const qb = this.baseQuery(instituteId);
    if (query.sessionId) qb.andWhere('batch.sessionId = :sessionId', { sessionId: query.sessionId });
    if (query.classId) qb.andWhere('batch.classId = :classId', { classId: query.classId });
    return qb.orderBy('academicClass.sortOrder', 'ASC', 'NULLS LAST').addOrderBy('batch.name', 'ASC').getMany();
  }

  async findOne(id: string, instituteId: string) {
    const batch = await this.baseQuery(instituteId).andWhere('batch.id = :id', { id }).getOne();
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  private async validateReferences(dto: Partial<CreateBatchDto>, instituteId: string) {
    if (dto.leadTeacherId && !(await this.teachersService.exists(dto.leadTeacherId, instituteId))) {
      throw new BadRequestException(`Unknown leadTeacherId: ${dto.leadTeacherId}`);
    }
    await this.sessionsService.assertBelongs(dto.sessionId, instituteId);
    await this.classesService.assertBelongs(dto.classId, instituteId);
  }

  async create(instituteId: string, dto: CreateBatchDto) {
    await this.validateReferences(dto, instituteId);
    const subjects = await this.subjectsService.findManyForInstitute(dto.subjectIds, instituteId);
    const batch = await this.repo.save(
      this.repo.create({
        name: dto.name,
        monthlyFee: dto.monthlyFee ?? 0,
        schedule: dto.schedule,
        leadTeacherId: dto.leadTeacherId ?? undefined,
        sessionId: dto.sessionId ?? null,
        classId: dto.classId ?? null,
        instituteId,
        subjects,
      }),
    );
    return this.findOne(batch.id, instituteId);
  }

  async update(id: string, instituteId: string, dto: UpdateBatchDto) {
    await this.findOne(id, instituteId);
    await this.validateReferences(dto, instituteId);

    // Load without the partial teacher select, so save() sees a normal entity.
    const batch = await this.repo.findOneOrFail({ where: { id, instituteId }, relations: ['subjects'] });
    const { subjectIds, ...fields } = dto;
    Object.assign(batch, pickDefined(fields));
    if (subjectIds) {
      batch.subjects = await this.subjectsService.findManyForInstitute(subjectIds, instituteId);
    }
    await this.repo.save(batch);
    return this.findOne(id, instituteId);
  }

  async remove(id: string, instituteId: string) {
    const batch = await this.findOne(id, instituteId);
    if (batch.activeStudentCount) {
      throw new ConflictException(
        `Batch has ${batch.activeStudentCount} active student(s). Mark their enrollments as left first, or make the batch inactive.`,
      );
    }
    await this.repo.softDelete({ id });
    return { id, deleted: true };
  }
}
