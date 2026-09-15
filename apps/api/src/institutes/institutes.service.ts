import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institute } from './entities/institute.entity';

@Injectable()
export class InstitutesService {
  constructor(
    @InjectRepository(Institute)
    private repo: Repository<Institute>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const institute = await this.repo.findOne({ where: { id } });
    if (!institute) throw new NotFoundException('Institute not found');
    return institute;
  }

  create(data: Partial<Institute>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<Institute>) {
    const institute = await this.findOne(id);
    Object.assign(institute, data);
    return this.repo.save(institute);
  }
}
