import { BadRequestException } from '@nestjs/common';

/** Today's date as YYYY-MM-DD in Bangladesh time (Asia/Dhaka), independent of server timezone. */
export function todayInDhaka(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
}

/** Throws if both dates are set and end is before start. Dates are YYYY-MM-DD strings. */
export function assertDateOrder(start: string | null | undefined, end: string | null | undefined, label: string) {
  if (start && end && end < start) {
    throw new BadRequestException(`${label}: end date cannot be before start date`);
  }
}
