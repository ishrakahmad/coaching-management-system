// Money math in whole paisa (integers), same as the API, so 0.1 + 0.2 is exactly 0.30.
export const toPaisa = (amount: number | string | null | undefined) => Math.round(Number(amount || 0) * 100);
export const fromPaisa = (paisa: number) => paisa / 100;
export const sumMoney = (values: (number | string)[]) => fromPaisa(values.reduce<number>((total, v) => total + toPaisa(v), 0));

/** A typed amount is valid if it has at most 2 decimal places. */
export const isValidAmount = (value: string) => /^\d+(\.\d{1,2})?$/.test(value.trim());
