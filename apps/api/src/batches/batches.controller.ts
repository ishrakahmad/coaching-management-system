import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BatchesService } from './batches.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/create-batch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Role } from '../users/enums/role.enum';

@ApiTags('batches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('batches')
export class BatchesController {
  constructor(private service: BatchesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.instituteId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id, user.instituteId);
  }

  @Roles(Role.INSTITUTE_ADMIN, Role.MANAGER)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBatchDto) {
    return this.service.create(user.instituteId, dto);
  }

  @Roles(Role.INSTITUTE_ADMIN, Role.MANAGER)
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBatchDto) {
    return this.service.update(id, user.instituteId, dto);
  }

  @Roles(Role.INSTITUTE_ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id, user.instituteId);
  }
}
