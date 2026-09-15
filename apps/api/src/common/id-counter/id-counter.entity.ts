import { Column, Entity, PrimaryColumn } from 'typeorm';

// One row per (institute, scope), e.g. scope "student-2026".
// Incremented atomically, so IDs are never reused — even after soft deletes.
@Entity('id_counters')
export class IdCounter {
  @PrimaryColumn({ name: 'institute_id', type: 'uuid' })
  instituteId: string;

  @PrimaryColumn()
  scope: string;

  @Column({ type: 'int', default: 0 })
  value: number;
}
