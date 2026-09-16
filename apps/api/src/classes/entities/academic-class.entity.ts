import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Institute } from '../../institutes/entities/institute.entity';

// A grade/level, e.g. "Class 9", "SSC", "HSC 1st Year".
// sortOrder drives display order and, later, promotion to the next class.
@Entity('classes')
@Index(['instituteId', 'name'], { unique: true, where: '"deleted_at" IS NULL' })
export class AcademicClass extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Institute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institute_id' })
  institute: Institute;

  @Column({ name: 'institute_id' })
  instituteId: string;
}
