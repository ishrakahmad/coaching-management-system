import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Payment } from './payment.entity';
import { StudentFee } from '../../fees/entities/student-fee.entity';

// How much of a payment went to which fee. Kept when a payment is voided (history).
@Entity('payment_allocations')
@Index(['paymentId', 'feeId'], { unique: true })
@Check(`"amount" > 0`)
export class PaymentAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Payment, (payment) => payment.allocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ name: 'payment_id' })
  paymentId: string;

  @ManyToOne(() => StudentFee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fee_id' })
  fee: StudentFee;

  @Index()
  @Column({ name: 'fee_id' })
  feeId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
