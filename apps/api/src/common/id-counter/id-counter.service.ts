import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

@Injectable()
export class IdCounterService {
  /**
   * Atomically returns the next number for (instituteId, scope).
   * Must be called inside the same transaction that inserts the record, so a
   * rollback also rolls back the counter. `startAfter` seeds a brand-new
   * counter (e.g. from rows created before this counter existed).
   */
  async next(manager: EntityManager, instituteId: string, scope: string, startAfter = 0): Promise<number> {
    const result = await manager.query(
      `INSERT INTO id_counters (institute_id, scope, value)
       VALUES ($1, $2, $3 + 1)
       ON CONFLICT (institute_id, scope)
       DO UPDATE SET value = id_counters.value + 1
       RETURNING value`,
      [instituteId, scope, startAfter],
    );
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return Number(rows[0].value);
  }
}
