import { FeeStatus, StudentFee } from './entities/student-fee.entity';
import { fromPaisa, toPaisa } from '../common/utils/money';

type FeeAmounts = Pick<StudentFee, 'amount' | 'discount' | 'paidAmount' | 'status'>;

export const feeDuePaisa = (fee: FeeAmounts) =>
  fee.status === FeeStatus.WAIVED ? 0 : toPaisa(fee.amount) - toPaisa(fee.discount) - toPaisa(fee.paidAmount);

/** Status follows from the amounts; a waived fee stays waived. */
export function computeFeeStatus(fee: FeeAmounts): FeeStatus {
  if (fee.status === FeeStatus.WAIVED) return FeeStatus.WAIVED;
  const net = toPaisa(fee.amount) - toPaisa(fee.discount);
  const paid = toPaisa(fee.paidAmount);
  if (paid >= net) return FeeStatus.PAID;
  return paid > 0 ? FeeStatus.PARTIAL : FeeStatus.UNPAID;
}

export function withDueAmount<T extends StudentFee>(fee: T): T {
  fee.dueAmount = fromPaisa(feeDuePaisa(fee));
  return fee;
}
