import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { UsersModule } from '../users/users.module';
import { BatchesModule } from '../batches/batches.module';
import { IdCounterModule } from '../common/id-counter/id-counter.module';

@Module({
  imports: [TypeOrmModule.forFeature([Student]), UsersModule, BatchesModule, IdCounterModule],
  providers: [StudentsService],
  controllers: [StudentsController],
  exports: [StudentsService],
})
export class StudentsModule {}
