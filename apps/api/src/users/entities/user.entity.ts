import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/base.entity';
import { Role } from '../enums/role.enum';
import { Institute } from '../../institutes/entities/institute.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column()
  fullName: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.STUDENT })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  avatarUrl: string;

  @ManyToOne(() => Institute, (institute) => institute.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institute_id' })
  institute: Institute;

  @Column({ name: 'institute_id' })
  instituteId: string;
}
