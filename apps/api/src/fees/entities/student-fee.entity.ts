import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Institute } from '../../institutes/entities/institute.entity';
import { Student } from '../../students/entities/student.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { Batch } from '../../batches/entities/batch.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

export enum FeeType {
  MONTHLY = 'monthly',
  ADMISSION = 'admission',
  EXAM = 'exam',
  OTHER = 'other',
}

export enum FeeStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
  WAIVED = 'waived',
}

// One charge a student owes: a month's batch fee, an admission fee, an exam fee...
@Entity('student_fees')
// A month can be billed only once per enrollment, even if generation runs many times.
@Index(['enrollmentId', 'period'], { unique: true, where: `"type" = 'monthly' AND "deleted_at" IS NULL` })
@Index(['instituteId', 'status'])
@Check(`"amount" >= 0 AND "discount" >= 0 AND "paidAmount" >= 0`)
@Check(`"discount" <= "amount"`)
@Check(`"paidAmount" <= "amount" - "discount"`)
export class StudentFee extends BaseEntity {
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

  @ManyToOne(() => Enrollment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Enrollment | null;

  @Column({ name: 'enrollment_id', nullable: true })
  enrollmentId: string | null;

  @ManyToOne(() => Batch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'batch_id' })
  batch: Batch | null;

  @Column({ name: 'batch_id', nullable: true })
  batchId: string | null;

  @Column({ type: 'varchar', length: 20 })
  type: FeeType;

  @Column()
  title: string;

  /** "YYYY-MM" for monthly fees; null for one-off fees. */
  @Column({ type: 'varchar', length: 7, nullable: true })
  period: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  discount: number;

  /** Kept in sync with non-voided payment allocations. */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  paidAmount: number;

  @Column({ type: 'varchar', length: 20, default: FeeStatus.UNPAID })
  status: FeeStatus;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ nullable: true })
  note: string;

  @Column({ nullable: true })
  waivedReason: string;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById: string | null;

  /** amount - discount - paidAmount; filled in responses, not stored. */
  dueAmount?: number;
}
