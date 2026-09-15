// Drops keys whose value is undefined, so partial updates don't overwrite
// existing columns with undefined.
export function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
