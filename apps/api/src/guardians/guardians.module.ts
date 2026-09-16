import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guardian } from './entities/guardian.entity';
import { GuardiansService } from './guardians.service';
import { GuardiansController } from './guardians.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Guardian]), UsersModule],
  providers: [GuardiansService],
  controllers: [GuardiansController],
  exports: [GuardiansService],
})
export class GuardiansModule {}
