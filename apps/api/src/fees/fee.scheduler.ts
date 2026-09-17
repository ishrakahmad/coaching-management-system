import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeesService } from './fees.service';
import { Institute } from '../institutes/entities/institute.entity';
import { currentPeriod } from '../common/utils/period';

@Injectable()
export class FeeScheduler {
  private readonly logger = new Logger(FeeScheduler.name);

  constructor(
    private feesService: FeesService,
    @InjectRepository(Institute) private institutes: Repository<Institute>,
  ) {}

  /**
   * Every day at 00:10 Bangladesh time, bill the current month for every active institute.
   * Daily (not only on the 1st) so a missed run or a student who joins mid-month is still billed;
   * generation never bills the same enrollment twice for a month.
   * Set FEE_AUTO_GENERATE=false to switch this off.
   */
  @Cron('10 0 * * *', { name: 'monthly-fee-generation', timeZone: 'Asia/Dhaka' })
  async generateCurrentMonth() {
    if (process.env.FEE_AUTO_GENERATE === 'false') return;
    const period = currentPeriod();
    for (const institute of await this.institutes.find({ where: { isActive: true } })) {
      try {
        const result = await this.feesService.generateMonthly(institute.id, period);
        if (result.created) this.logger.log(`${institute.name}: billed ${result.created} enrollment(s) for ${result.label}`);
      } catch (error) {
        this.logger.error(`${institute.name}: fee generation for ${period} failed`, (error as Error).stack);
      }
    }
  }
}
