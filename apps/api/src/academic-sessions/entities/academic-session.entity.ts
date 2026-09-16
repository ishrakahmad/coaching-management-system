import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Institute } from '../../institutes/entities/institute.entity';

// An academic year / intake, e.g. "2026" or "2026-2027".
@Entity('academic_sessions')
@Index(['instituteId', 'name'], { unique: true, where: '"deleted_at" IS NULL' })
// Database-level guarantee: at most one current session per institute.
@Index(['instituteId'], { unique: true, where: '"isCurrent" = true AND "deleted_at" IS NULL' })
export class AcademicSession extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({ default: false })
  isCurrent: boolean;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Institute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institute_id' })
  institute: Institute;

  @Column({ name: 'institute_id' })
  instituteId: string;
}
