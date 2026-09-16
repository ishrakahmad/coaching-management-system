import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Institute } from '../../institutes/entities/institute.entity';
import { User } from '../../users/entities/user.entity';
import { Student } from '../../students/entities/student.entity';

// A parent/guardian. Siblings share one guardian record (matched by phone).
// A login account (role=guardian) is optional and can be added later.
@Entity('guardians')
@Index(['instituteId', 'phone'], { unique: true, where: '"phone" IS NOT NULL AND "deleted_at" IS NULL' })
export class Guardian extends BaseEntity {
  @Column()
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ nullable: true })
  address: string;

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @ManyToOne(() => Institute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institute_id' })
  institute: Institute;

  @Column({ name: 'institute_id' })
  instituteId: string;

  @OneToMany(() => Student, (student) => student.guardian)
  students: Student[];
}
