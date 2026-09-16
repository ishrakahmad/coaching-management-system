/** "+8801711111111" / "8801711111111" / "01711111111" -> "01711111111". */
export function normalizeBdPhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('88') ? digits.slice(2) : digits;
}
