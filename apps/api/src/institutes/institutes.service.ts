import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institute } from './entities/institute.entity';
import { CreateInstituteDto, UpdateInstituteDto } from './dto/create-institute.dto';

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

  create(dto: CreateInstituteDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateInstituteDto) {
    const institute = await this.findOne(id);
    Object.assign(institute, dto);
    return this.repo.save(institute);
  }
}
