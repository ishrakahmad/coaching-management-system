import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { IdCounterModule } from '../common/id-counter/id-counter.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, PaymentAllocation]), IdCounterModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
