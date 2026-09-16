import { Entity, Column, OneToOne, JoinColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../users/entities/user.entity';
import { Institute } from '../../institutes/entities/institute.entity';
import { Guardian } from '../../guardians/entities/guardian.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';

export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRANSFERRED = 'transferred',
  GRADUATED = 'graduated',
}

export enum GuardianRelation {
  FATHER = 'father',
  MOTHER = 'mother',
  SIBLING = 'sibling',
  RELATIVE = 'relative',
  OTHER = 'other',
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

  @ManyToOne(() => Guardian, (guardian) => guardian.students, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'guardian_id' })
  guardian: Guardian | null;

  @Index()
  @Column({ name: 'guardian_id', nullable: true })
  guardianId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  guardianRelation: GuardianRelation | null;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE })
  status: StudentStatus;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  admissionDate: Date;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];
}
