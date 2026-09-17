import type { FeeStatus, FeeType, GuardianRelation, PaymentMethod, Role, StudentStatus } from '../types';
import type { BadgeTone } from '../components/ui/StatusBadge';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

/** "2026-01-01" -> "1 Jan 2026". Parsed as a calendar date, so no timezone shift. */
export function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return dateFormat.format(new Date(y, m - 1, d));
}

/** "2026-09" -> "September 2026" */
export function formatPeriod(period: string) {
  const [y, m] = period.split('-').map(Number);
  return monthFormat.format(new Date(y, m - 1, 1));
}

/** ৳ 1,50,000 — South Asian digit grouping; paisa shown only when present. */
export function formatTaka(amount: number | null | undefined) {
  const value = amount ?? 0;
  return `৳ ${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Today's date as YYYY-MM-DD in Bangladesh time. */
export const todayInDhaka = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());

export function shiftPeriod(period: string, months: number) {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 1 + months, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const relationLabel: Record<GuardianRelation, string> = {
  father: 'বাবা',
  mother: 'মা',
  sibling: 'ভাই/বোন',
  relative: 'আত্মীয়',
  other: 'অন্যান্য',
};

export const studentStatusMeta: Record<StudentStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'সক্রিয়', tone: 'active' },
  inactive: { label: 'নিষ্ক্রিয়', tone: 'muted' },
  transferred: { label: 'Transfer', tone: 'muted' },
  graduated: { label: 'পাশ করে গেছে', tone: 'muted' },
};

export const feeStatusMeta: Record<FeeStatus, { label: string; tone: BadgeTone }> = {
  unpaid: { label: 'বাকি', tone: 'attention' },
  partial: { label: 'আংশিক', tone: 'attention' },
  paid: { label: 'পরিশোধিত', tone: 'active' },
  waived: { label: 'মওকুফ', tone: 'muted' },
};

export const feeTypeLabel: Record<FeeType, string> = {
  monthly: 'মাসিক',
  admission: 'ভর্তি',
  exam: 'পরীক্ষা',
  other: 'অন্যান্য',
};

export const methodLabel: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  bank: 'Bank',
  card: 'Card',
};

export const roleLabel: Partial<Record<Role, string>> = {
  super_admin: 'Super admin',
  institute_admin: 'Admin',
  teacher: 'Teacher',
  manager: 'Manager',
  accountant: 'Accountant',
  employee: 'Employee',
};

// ---- Amount in words (Bangladeshi system: thousand, lakh, crore) for receipts ----
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowHundred(n: number) {
  return n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ' ' + ones[n % 10] : ''}`;
}
function belowThousand(n: number) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ones[h]} Hundred` : '', rest ? belowHundred(rest) : ''].filter(Boolean).join(' ');
}
function integerWords(n: number): string {
  if (n === 0) return 'Zero';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  return [
    crore ? `${integerWords(crore)} Crore` : '',
    lakh ? `${belowHundred(lakh)} Lakh` : '',
    thousand ? `${belowHundred(thousand)} Thousand` : '',
    rest ? belowThousand(rest) : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** 1520.5 -> "Taka One Thousand Five Hundred Twenty and Fifty Paisa Only" */
export function amountInWords(amount: number) {
  const paisaTotal = Math.round(amount * 100);
  const taka = Math.floor(paisaTotal / 100);
  const paisa = paisaTotal % 100;
  return `Taka ${integerWords(taka)}${paisa ? ` and ${belowHundred(paisa)} Paisa` : ''} Only`;
}
