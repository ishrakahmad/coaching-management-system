import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GuardiansService } from './guardians.service';
import { CreateGuardianAccountDto, CreateGuardianDto, UpdateGuardianDto } from './dto/guardian.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { MANAGE_ROLES, STAFF_ROLES } from '../common/constants/roles';
import { Role } from '../users/enums/role.enum';

@ApiTags('guardians')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('guardians')
export class GuardiansController {
  constructor(private service: GuardiansService) {}

  @Roles(...STAFF_ROLES)
  @ApiQuery({ name: 'search', required: false, description: 'Name or phone' })
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.service.findAll(user.instituteId, search);
  }

  @Roles(...STAFF_ROLES)
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id, user.instituteId);
  }

  @Roles(...MANAGE_ROLES)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateGuardianDto) {
    return this.service.create(user.instituteId, dto);
  }

  @Roles(...MANAGE_ROLES)
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGuardianDto) {
    return this.service.update(id, user.instituteId, dto);
  }

  @Roles(Role.INSTITUTE_ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id, user.instituteId);
  }

  @Roles(...MANAGE_ROLES)
  @Post(':id/account')
  createAccount(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateGuardianAccountDto) {
    return this.service.createAccount(id, user.instituteId, dto);
  }
}
