import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Student } from '../../students/entities/student.entity';
import { Batch } from '../../batches/entities/batch.entity';
import { Institute } from '../../institutes/entities/institute.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

export enum EnrollmentStatus {
  ACTIVE = 'active',
  LEFT = 'left',
}

// A student's membership in a batch over time. Replaces the old plain
// many-to-many so fees can know *when* a student joined/left and whether
// they pay a different amount than the batch fee.
@Entity('enrollments')
// A student can re-join a batch later, but can't be actively enrolled twice.
@Index(['studentId', 'batchId'], { unique: true, where: `"status" = 'active' AND "deleted_at" IS NULL` })
export class Enrollment extends BaseEntity {
  @ManyToOne(() => Student, (student) => student.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Index()
  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Batch, (batch) => batch.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @Index()
  @Column({ name: 'batch_id' })
  batchId: string;

  @ManyToOne(() => Institute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institute_id' })
  institute: Institute;

  @Column({ name: 'institute_id' })
  instituteId: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  enrolledAt: string;

  @Column({ type: 'date', nullable: true })
  leftAt: string | null;

  @Column({ type: 'varchar', length: 20, default: EnrollmentStatus.ACTIVE })
  status: EnrollmentStatus;

  /** Monthly fee for this student in this batch. null = use the batch's monthlyFee. */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: decimalTransformer })
  feeOverride: number | null;
}
