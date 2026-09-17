// Money is stored as NUMERIC(10,2). All arithmetic is done in whole paisa
// (integers) so 0.1 + 0.2 style float errors can never reach the database.
export const toPaisa = (amount: number | null | undefined) => Math.round((amount ?? 0) * 100);
export const fromPaisa = (paisa: number) => paisa / 100;
