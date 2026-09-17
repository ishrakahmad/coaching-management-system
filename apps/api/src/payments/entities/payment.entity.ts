import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Institute } from '../../institutes/entities/institute.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { PaymentAllocation } from './payment-allocation.entity';

export enum PaymentMethod {
  CASH = 'cash',
  BKASH = 'bkash',
  NAGAD = 'nagad',
  ROCKET = 'rocket',
  BANK = 'bank',
  CARD = 'card',
}

// Money received from a student. Never deleted: a mistake is voided, so the
// receipt number and the history stay.
@Entity('payments')
@Index(['instituteId', 'receiptNo'], { unique: true })
@Index(['instituteId', 'paidAt'])
@Check(`"amount" > 0`)
export class Payment extends BaseEntity {
  @ManyToOne(() => Institute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institute_id' })
  institute: Institute;

  @Column({ name: 'institute_id' })
  instituteId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Index()
  @Column({ name: 'student_id' })
  studentId: string;

  /** e.g. "RCP-2026-00042" — sequential per institute per year. */
  @Column()
  receiptNo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })
  amount: number;

  @Column({ type: 'varchar', length: 20 })
  method: PaymentMethod;

  /** bKash/Nagad transaction ID, cheque or bank reference. */
  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'date' })
  paidAt: string;

  @Column({ nullable: true })
  note: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'received_by_id' })
  receivedBy: User | null;

  @Column({ name: 'received_by_id', type: 'uuid', nullable: true })
  receivedById: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  voidedAt: Date | null;

  @Column({ name: 'voided_by_id', type: 'uuid', nullable: true })
  voidedById: string | null;

  @Column({ nullable: true })
  voidReason: string;

  @OneToMany(() => PaymentAllocation, (allocation) => allocation.payment)
  allocations: PaymentAllocation[];
}
