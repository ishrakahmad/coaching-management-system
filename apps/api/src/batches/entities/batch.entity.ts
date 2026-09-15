import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Institute } from '../../institutes/entities/institute.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

@Entity('batches')
export class Batch extends BaseEntity {
  @Column()
  name: string; // e.g. "HSC 2027 - Science - Morning"

  @Column({ nullable: true })
  session: string; // e.g. "2026-2027"

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
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

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lead_teacher_id' })
  leadTeacher: Teacher;

  @Column({ name: 'lead_teacher_id', nullable: true })
  leadTeacherId: string;

  @ManyToMany(() => Subject)
  @JoinTable({ name: 'batch_subjects' })
  subjects: Subject[];
}
