import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { BaseEntity } from '../../common/base.entity';
import { Institute } from '../../institutes/entities/institute.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { AcademicSession } from '../../academic-sessions/entities/academic-session.entity';
import { AcademicClass } from '../../classes/entities/academic-class.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';

@Entity('batches')
export class Batch extends BaseEntity {
  @Column()
  name: string; // e.g. "HSC 2027 - Science - Morning"

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  monthlyFee: number;

  @Column({ nullable: true })
  schedule: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Institute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institute_id' })
  institute: Institute;

  @Column({ name: 'institute_id' })
  instituteId: string;

  @ManyToOne(() => AcademicSession, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'session_id' })
  academicSession: AcademicSession | null;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string | null;

  @ManyToOne(() => AcademicClass, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  academicClass: AcademicClass | null;

  @Column({ name: 'class_id', nullable: true })
  classId: string | null;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lead_teacher_id' })
  leadTeacher: Teacher;

  @Column({ name: 'lead_teacher_id', nullable: true })
  leadTeacherId: string;

  @ManyToMany(() => Subject)
  @JoinTable({ name: 'batch_subjects' })
  subjects: Subject[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.batch)
  enrollments: Enrollment[];

  /** Filled by list queries: number of currently active enrollments. */
  activeStudentCount?: number;
}
