import { Entity, Column, OneToOne, JoinColumn, ManyToOne, ManyToMany, JoinTable, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../users/entities/user.entity';
import { Institute } from '../../institutes/entities/institute.entity';
import { Batch } from '../../batches/entities/batch.entity';

export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRANSFERRED = 'transferred',
  GRADUATED = 'graduated',
}

@Entity('students')
// Student IDs are unique per institute, not globally: every institute has its own STD-2026-0001.
@Index(['instituteId', 'studentId'], { unique: true })
export class Student extends BaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Institute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institute_id' })
  institute: Institute;

  @Column({ name: 'institute_id' })
  instituteId: string;

  @Column()
  studentId: string; // human-readable admission number, e.g. "STD-2026-0001"

  @Column({ nullable: true })
  guardianName: string;

  @Column({ nullable: true })
  guardianPhone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE })
  status: StudentStatus;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  admissionDate: Date;

  @ManyToMany(() => Batch)
  @JoinTable({ name: 'student_batches' })
  batches: Batch[];
}
