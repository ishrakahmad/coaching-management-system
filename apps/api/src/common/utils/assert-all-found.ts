import { BadRequestException } from '@nestjs/common';

// Used when a request references several IDs (subjectIds, batchIds...).
// Rejects the whole request if any ID is unknown or belongs to another institute.
export function assertAllFound<T extends { id: string }>(found: T[], ids: string[], label: string) {
  const foundIds = new Set(found.map((item) => item.id));
  const missing = [...new Set(ids)].filter((id) => !foundIds.has(id));
  if (missing.length) {
    throw new BadRequestException(`Unknown ${label}: ${missing.join(', ')}`);
  }
}
