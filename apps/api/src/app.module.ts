import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InstitutesModule } from './institutes/institutes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TeachersModule } from './teachers/teachers.module';
import { BatchesModule } from './batches/batches.module';
import { StudentsModule } from './students/students.module';
import { IdCounterModule } from './common/id-counter/id-counter.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
    TypeOrmModule.forRootAsync({ useFactory: databaseConfig }),
    IdCounterModule,
    AuthModule,
    UsersModule,
    InstitutesModule,
    SubjectsModule,
    TeachersModule,
    BatchesModule,
    StudentsModule,
    // Next: AttendanceModule, FeesModule, PaymentsModule, ExamModule,
    // ResultsModule, HomeworkModule, ReportsModule, NotificationsModule...
  ],
})
export class AppModule {}
