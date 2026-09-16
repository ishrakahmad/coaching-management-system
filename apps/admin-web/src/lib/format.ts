import type { GuardianRelation } from '../types';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** "2026-01-01" -> "1 Jan 2026". Parsed as a calendar date, so no timezone shift. */
export function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return dateFormat.format(new Date(y, m - 1, d));
}

export function formatTaka(amount: number | null | undefined) {
  return `৳ ${(amount ?? 0).toLocaleString('en-IN')}`;
}

export const relationLabel: Record<GuardianRelation, string> = {
  father: 'বাবা',
  mother: 'মা',
  sibling: 'ভাই/বোন',
  relative: 'আত্মীয়',
  other: 'অন্যান্য',
};
