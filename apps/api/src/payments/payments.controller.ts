import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentsQueryDto, VoidPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { FINANCE_ROLES, VOID_PAYMENT_ROLES } from '../common/constants/roles';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...FINANCE_ROLES)
@Controller('payments')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: PaymentsQueryDto) {
    return this.service.findAll(user.instituteId, query);
  }

  /** Includes institute and student details for printing a receipt. */
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id, user.instituteId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.service.create(user.instituteId, user.userId, dto);
  }

  @Roles(...VOID_PAYMENT_ROLES)
  @HttpCode(200)
  @Post(':id/void')
  void(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: VoidPaymentDto) {
    return this.service.void(id, user.instituteId, user.userId, dto.reason);
  }
}
