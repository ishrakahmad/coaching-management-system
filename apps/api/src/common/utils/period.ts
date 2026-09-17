import { BadRequestException } from '@nestjs/common';
import { todayInDhaka } from './dates';

export const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const monthName = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Current billing month in Bangladesh time, e.g. "2026-09". */
export const currentPeriod = () => todayInDhaka().slice(0, 7);

/** "2026-09" -> { start: "2026-09-01", end: "2026-09-30", label: "September 2026" } */
export function periodInfo(period: string) {
  if (!PERIOD_PATTERN.test(period)) throw new BadRequestException('period must look like YYYY-MM');
  const [year, month] = period.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${period}-01`,
    end: `${period}-${String(lastDay).padStart(2, '0')}`,
    label: monthName.format(new Date(Date.UTC(year, month - 1, 1))),
  };
}

export function nextPeriod(period: string) {
  const [year, month] = period.split('-').map(Number);
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
}
