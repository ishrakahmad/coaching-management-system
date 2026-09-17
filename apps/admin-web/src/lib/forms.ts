import { z } from 'zod';

// Shared zod helpers. Empty inputs become undefined (or null where the API accepts null),
// so optional fields aren't sent as "" and rejected by the API.
const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v);

export const optionalText = (max = 300) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
export const requiredText = (label: string, max = 150) =>
  z.string().trim().min(1, `${label} দিন`).max(max, `${label} ${max} অক্ষরের বেশি হতে পারবে না`);
export const optionalDate = z.preprocess(emptyToUndefined, z.string().optional());
export const nullableDate = z.preprocess((v) => (v === '' ? null : v), z.string().nullable().optional());
export const optionalId = z.preprocess(emptyToUndefined, z.string().uuid().optional());
export const nullableId = z.preprocess((v) => (v === '' ? null : v), z.string().uuid().nullable().optional());

export const money = (label: string) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number({ invalid_type_error: `${label} সংখ্যায় লিখুন`, required_error: `${label} দিন` }).min(0, `${label} ঋণাত্মক হতে পারে না`),
  );
export const optionalMoney = (label: string) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number({ invalid_type_error: `${label} সংখ্যায় লিখুন` }).min(0, `${label} ঋণাত্মক হতে পারে না`).optional(),
  );

// Bangladeshi mobile, same rule as the API.
export const bdPhone = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^(?:\+?88)?01[3-9]\d{8}$/, 'সঠিক mobile নম্বর দিন (01XXXXXXXXX)').optional(),
);

/** Removes keys whose value is undefined before sending a PATCH. */
export const compact = <T extends Record<string, unknown>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
