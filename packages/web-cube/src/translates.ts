export type TranslateFn = (idx: number) => string;

export function createTranslates(size: number): TranslateFn {
  const isEven = size % 2 === 0;
  if (isEven) {
    const half = size / 2 - 1;
    return (idx: number) =>
      idx <= half
        ? `calc((-1 * var(--step-size)) - (${half - idx} * var(--block-size)))`
        : `calc(var(--step-size) + (${idx - half} * var(--block-size)))`;
  }
  const newStart = Math.floor(size / 2);
  return (idx: number) => `calc(${newStart + idx} * var(--block-size))`;
}
