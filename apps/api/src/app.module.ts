import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import databaseConfig from './config/database.config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InstitutesModule } from './institutes/institutes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TeachersModule } from './teachers/teachers.module';
import { BatchesModule } from './batches/batches.module';
import { StudentsModule } from './students/students.module';
import { IdCounterModule } from './common/id-counter/id-counter.module';
import { AcademicSessionsModule } from './academic-sessions/academic-sessions.module';
import { ClassesModule } from './classes/classes.module';
import { GuardiansModule } from './guardians/guardians.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { FeesModule } from './fees/fees.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
    TypeOrmModule.forRootAsync({ useFactory: databaseConfig }),
    ScheduleModule.forRoot(),
    IdCounterModule,
    AuthModule,
    UsersModule,
    InstitutesModule,
    AcademicSessionsModule,
    ClassesModule,
    SubjectsModule,
    TeachersModule,
    BatchesModule,
    GuardiansModule,
    EnrollmentsModule,
    StudentsModule,
    FeesModule,
    PaymentsModule,
    // Next: Attendance, Exam,
    // ResultsModule, HomeworkModule, ReportsModule, NotificationsModule...
  ],
})
export class AppModule {}
