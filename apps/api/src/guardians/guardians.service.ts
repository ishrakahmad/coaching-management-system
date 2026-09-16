import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Guardian } from './entities/guardian.entity';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { UsersService } from '../users/users.service';
import { CreateGuardianAccountDto, CreateGuardianDto, UpdateGuardianDto } from './dto/guardian.dto';
import { normalizeBdPhone } from '../common/utils/phone';
import { pickDefined } from '../common/utils/pick-defined';

@Injectable()
export class GuardiansService {
  constructor(
    @InjectRepository(Guardian)
    private repo: Repository<Guardian>,
    @InjectDataSource()
    private dataSource: DataSource,
    private usersService: UsersService,
  ) {}

  /** Optional search matches name or phone. Each guardian includes their (non-deleted) children. */
  findAll(instituteId: string, search?: string) {
    const qb = this.repo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.students', 's')
      .leftJoinAndSelect('s.user', 'su')
      .where('g.instituteId = :instituteId', { instituteId })
      .orderBy('g.fullName', 'ASC');
    const term = search?.trim();
    if (term) {
      const phone = normalizeBdPhone(term);
      qb.andWhere(
        new Brackets((w) => {
          w.where('g.fullName ILIKE :name', { name: `%${term}%` });
          if (phone) w.orWhere('g.phone LIKE :phone', { phone: `%${phone}%` });
        }),
      );
    }
    return qb.getMany();
  }

  async findOne(id: string, instituteId: string) {
    const guardian = await this.repo.findOne({
      where: { id, instituteId },
      relations: ['students', 'students.user'],
    });
    if (!guardian) throw new NotFoundException('Guardian not found');
    return guardian;
  }

  async findOrFail(id: string, instituteId: string, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Guardian) : this.repo;
    const guardian = await repo.findOne({ where: { id, instituteId } });
    if (!guardian) throw new NotFoundException('Guardian not found');
    return guardian;
  }

  /**
   * Used during admission. If a guardian with the same phone already exists in
   * this institute (e.g. an older sibling's parent), that record is reused.
   */
  async findOrCreate(manager: EntityManager, instituteId: string, dto: CreateGuardianDto) {
    const phone = normalizeBdPhone(dto.phone);
    if (phone) {
      const existing = await manager.findOne(Guardian, { where: { instituteId, phone } });
      if (existing) return existing;
    }
    return manager.save(manager.create(Guardian, { ...dto, phone, instituteId }));
  }

  async create(instituteId: string, dto: CreateGuardianDto) {
    const guardian = await this.repo.save(
      this.repo.create({ ...dto, phone: normalizeBdPhone(dto.phone), instituteId }),
    );
    return this.findOne(guardian.id, instituteId);
  }

  async update(id: string, instituteId: string, dto: UpdateGuardianDto) {
    await this.findOrFail(id, instituteId);
    const changes = pickDefined({ ...dto, phone: dto.phone === undefined ? undefined : normalizeBdPhone(dto.phone) });
    if (Object.keys(changes).length) await this.repo.update({ id }, changes);
    return this.findOne(id, instituteId);
  }

  async remove(id: string, instituteId: string) {
    const guardian = await this.findOrFail(id, instituteId);
    const studentCount = await this.dataSource.getRepository(Student).count({ where: { guardianId: id } });
    if (studentCount) {
      throw new ConflictException(`Guardian is linked to ${studentCount} student(s). Link them to another guardian first.`);
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Guardian, { id });
      if (guardian.userId) await manager.softDelete(User, { id: guardian.userId });
    });
    return { id, deleted: true };
  }

  /** Gives the guardian a login (role=guardian) for the future guardian portal. */
  async createAccount(id: string, instituteId: string, dto: CreateGuardianAccountDto) {
    const guardian = await this.findOrFail(id, instituteId);
    if (guardian.userId) throw new ConflictException('Guardian already has a login account');
    if (await this.usersService.findByEmail(dto.email)) throw new ConflictException('Email already in use');

    const password = await bcrypt.hash(dto.password, 10);
    await this.dataSource.transaction(async (manager) => {
      const user = await manager.save(
        manager.create(User, {
          fullName: guardian.fullName,
          email: dto.email,
          phone: guardian.phone,
          password,
          role: Role.GUARDIAN,
          instituteId,
        }),
      );
      await manager.update(Guardian, { id }, { userId: user.id, email: guardian.email ?? dto.email });
    });
    return this.findOne(id, instituteId);
  }
}
