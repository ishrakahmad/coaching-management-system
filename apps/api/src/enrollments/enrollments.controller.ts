import { Body, Controller, Get, HttpCode, Param, ParseBoolPipe, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto, LeaveEnrollmentDto, UpdateEnrollmentDto } from './dto/enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { MANAGE_ROLES, STAFF_ROLES } from '../common/constants/roles';

@ApiTags('enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class EnrollmentsController {
  constructor(private service: EnrollmentsService) {}

  @Roles(...STAFF_ROLES)
  @Get('students/:studentId/enrollments')
  findForStudent(@CurrentUser() user: AuthUser, @Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.findForStudent(studentId, user.instituteId);
  }

  @Roles(...MANAGE_ROLES)
  @Post('students/:studentId/enrollments')
  enroll(
    @CurrentUser() user: AuthUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() dto: CreateEnrollmentDto,
  ) {
    return this.service.enroll(studentId, user.instituteId, dto, user.userId);
  }

  @Roles(...STAFF_ROLES)
  @ApiQuery({ name: 'includeLeft', required: false, type: Boolean })
  @Get('batches/:batchId/enrollments')
  findForBatch(
    @CurrentUser() user: AuthUser,
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Query('includeLeft', new ParseBoolPipe({ optional: true })) includeLeft?: boolean,
  ) {
    return this.service.findForBatch(batchId, user.instituteId, includeLeft);
  }

  @Roles(...MANAGE_ROLES)
  @Patch('enrollments/:id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEnrollmentDto) {
    return this.service.update(id, user.instituteId, dto);
  }

  @Roles(...MANAGE_ROLES)
  @HttpCode(200)
  @Post('enrollments/:id/leave')
  leave(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: LeaveEnrollmentDto) {
    return this.service.leave(id, user.instituteId, dto);
  }
}
