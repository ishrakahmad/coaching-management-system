import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { UsersModule } from '../users/users.module';
import { GuardiansModule } from '../guardians/guardians.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { IdCounterModule } from '../common/id-counter/id-counter.module';
import { FeesModule } from '../fees/fees.module';

@Module({
  imports: [TypeOrmModule.forFeature([Student]), UsersModule, GuardiansModule, EnrollmentsModule, IdCounterModule, FeesModule],
  providers: [StudentsService],
  controllers: [StudentsController],
  exports: [StudentsService],
})
export class StudentsModule {}
