import { Entity, Column, OneToOne, JoinColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../users/entities/user.entity';
import { Institute } from '../../institutes/entities/institute.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity('teachers')
export class Teacher extends BaseEntity {
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

  @Column({ nullable: true })
  designation: string;

  @Column({ nullable: true })
  qualification: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthlySalary: number;

  @ManyToMany(() => Subject)
  @JoinTable({ name: 'teacher_subjects' })
  subjects: Subject[];

  @Column({ default: true })
  isActive: boolean;
}
