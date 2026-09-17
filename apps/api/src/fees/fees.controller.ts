import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FeesService } from './fees.service';
import {
  CreateFeeDto, DuesQueryDto, FeesQueryDto, GenerateMonthlyFeesDto, SummaryQueryDto, UpdateFeeDto, WaiveFeeDto,
} from './dto/fee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { FINANCE_ROLES } from '../common/constants/roles';

@ApiTags('fees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...FINANCE_ROLES)
@Controller()
export class FeesController {
  constructor(private service: FeesService) {}

  @HttpCode(200)
  @Post('fees/generate-monthly')
  generateMonthly(@CurrentUser() user: AuthUser, @Body() dto: GenerateMonthlyFeesDto) {
    return this.service.generateMonthly(user.instituteId, dto.period, { batchId: dto.batchId, userId: user.userId });
  }

  @Get('fees/dues')
  dues(@CurrentUser() user: AuthUser, @Query() query: DuesQueryDto) {
    return this.service.dues(user.instituteId, query);
  }

  @Get('fees/summary')
  summary(@CurrentUser() user: AuthUser, @Query() query: SummaryQueryDto) {
    return this.service.summary(user.instituteId, query.period);
  }

  @Get('fees')
  findAll(@CurrentUser() user: AuthUser, @Query() query: FeesQueryDto) {
    return this.service.findAll(user.instituteId, query);
  }

  @Post('fees')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFeeDto) {
    return this.service.create(user.instituteId, dto, user.userId);
  }

  @Get('fees/:id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id, user.instituteId);
  }

  @Patch('fees/:id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFeeDto) {
    return this.service.update(id, user.instituteId, dto);
  }

  @HttpCode(200)
  @Post('fees/:id/waive')
  waive(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: WaiveFeeDto) {
    return this.service.waive(id, user.instituteId, dto.reason);
  }

  @Delete('fees/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id, user.instituteId);
  }

  @Get('students/:studentId/fees')
  ledger(@CurrentUser() user: AuthUser, @Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.ledger(studentId, user.instituteId);
  }
}
