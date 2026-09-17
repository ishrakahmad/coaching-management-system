import {
  Body, ConflictException, Controller, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './enums/role.enum';
import { ASSIGNABLE_STAFF_ROLES, CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { pickDefined } from '../common/utils/pick-defined';

const LISTED_ROLES = [Role.INSTITUTE_ADMIN, ...ASSIGNABLE_STAFF_ROLES];

/** Office staff logins (admin, manager, accountant, employee). Teachers are managed under /teachers. */
@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTITUTE_ADMIN)
@Controller('staff')
export class StaffController {
  constructor(@InjectRepository(User) private users: Repository<User>) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.users.find({
      where: { instituteId: user.instituteId, role: In(LISTED_ROLES) },
      order: { role: 'ASC', fullName: 'ASC' },
    });
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateStaffDto) {
    if (await this.users.exists({ where: { email: dto.email } })) throw new ConflictException('Email already in use');
    const saved = await this.users.save(
      this.users.create({ ...dto, password: await bcrypt.hash(dto.password, 10), instituteId: user.instituteId }),
    );
    return this.users.findOneByOrFail({ id: saved.id });
  }

  @Patch(':id')
  async update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) {
    const target = await this.users.findOne({ where: { id, instituteId: user.instituteId, role: In(LISTED_ROLES) } });
    if (!target) throw new NotFoundException('Staff member not found');
    if (target.role === Role.INSTITUTE_ADMIN) {
      throw new ForbiddenException('Institute admin accounts cannot be changed here');
    }
    await this.users.update({ id }, pickDefined({ ...dto }));
    return this.users.findOneByOrFail({ id });
  }
}
