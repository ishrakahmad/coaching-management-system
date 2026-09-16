import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AcademicSessionsService } from './academic-sessions.service';
import { CreateAcademicSessionDto, UpdateAcademicSessionDto } from './dto/academic-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { MANAGE_ROLES } from '../common/constants/roles';
import { Role } from '../users/enums/role.enum';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sessions')
export class AcademicSessionsController {
  constructor(private service: AcademicSessionsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.instituteId);
  }

  // Declared before ':id' so "current" isn't parsed as an ID.
  @Get('current')
  findCurrent(@CurrentUser() user: AuthUser) {
    return this.service.findCurrent(user.instituteId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id, user.instituteId);
  }

  @Roles(...MANAGE_ROLES)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAcademicSessionDto) {
    return this.service.create(user.instituteId, dto);
  }

  @Roles(...MANAGE_ROLES)
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAcademicSessionDto) {
    return this.service.update(id, user.instituteId, dto);
  }

  @Roles(Role.INSTITUTE_ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id, user.instituteId);
  }
}
