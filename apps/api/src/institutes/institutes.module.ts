import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institute } from './entities/institute.entity';
import { InstitutesService } from './institutes.service';
import { InstitutesController } from './institutes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Institute])],
  providers: [InstitutesService],
  controllers: [InstitutesController],
  exports: [InstitutesService],
})
export class InstitutesModule {}
