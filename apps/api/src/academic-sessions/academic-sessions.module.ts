import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicSession } from './entities/academic-session.entity';
import { AcademicSessionsService } from './academic-sessions.service';
import { AcademicSessionsController } from './academic-sessions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicSession])],
  providers: [AcademicSessionsService],
  controllers: [AcademicSessionsController],
  exports: [AcademicSessionsService],
})
export class AcademicSessionsModule {}
