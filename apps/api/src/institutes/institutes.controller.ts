import {
  Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InstitutesService } from './institutes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Role } from '../users/enums/role.enum';
import { CreateInstituteDto, UpdateInstituteDto } from './dto/create-institute.dto';

@ApiTags('institutes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('institutes')
export class InstitutesController {
  constructor(private service: InstitutesService) {}

  @Roles(Role.SUPER_ADMIN)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    this.assertOwnInstitute(user, id);
    return this.service.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateInstituteDto) {
    return this.service.create(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.INSTITUTE_ADMIN)
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInstituteDto) {
    this.assertOwnInstitute(user, id);
    if (user.role !== Role.SUPER_ADMIN && (dto.slug !== undefined || dto.isActive !== undefined)) {
      throw new ForbiddenException('Only a super admin can change slug or active status');
    }
    return this.service.update(id, dto);
  }

  private assertOwnInstitute(user: AuthUser, instituteId: string) {
    if (user.role !== Role.SUPER_ADMIN && user.instituteId !== instituteId) {
      throw new ForbiddenException();
    }
  }
}
