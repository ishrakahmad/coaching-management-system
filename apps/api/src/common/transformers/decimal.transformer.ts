import { ValueTransformer } from 'typeorm';

// Postgres returns DECIMAL columns as strings ("1500.00") to avoid float
// precision loss. Money values in this app stay well inside JS number
// precision, so convert them back to numbers at the entity boundary.
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : parseFloat(value),
};
