import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentFee } from './entities/student-fee.entity';
import { Institute } from '../institutes/entities/institute.entity';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { FeeScheduler } from './fee.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([StudentFee, Institute])],
  providers: [FeesService, FeeScheduler],
  controllers: [FeesController],
  exports: [FeesService],
})
export class FeesModule {}
