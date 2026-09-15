import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdCounter } from './id-counter.entity';
import { IdCounterService } from './id-counter.service';

@Module({
  imports: [TypeOrmModule.forFeature([IdCounter])],
  providers: [IdCounterService],
  exports: [IdCounterService],
})
export class IdCounterModule {}
