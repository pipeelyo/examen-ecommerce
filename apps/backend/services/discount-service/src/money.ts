import type { CartLineState } from "./strategies/discount-strategy.interface";

export function runningSum(lines: ReadonlyArray<CartLineState>): number {
  return lines.reduce((sum, line) => sum + line.remainingAmount, 0);
}

export function takePercent(
  lines: ReadonlyArray<CartLineState>,
  selector: (line: CartLineState) => boolean,
  percent: number,
): { amount: number; lines: CartLineState[] } {
  const next = lines.map((line) => ({ ...line }));
  const indexes = next
    .map((line, index) => (selector(line) ? index : -1))
    .filter((index) => index >= 0);

  if (indexes.length === 0) {
    return { amount: 0, lines: next };
  }

  const targetSum = indexes.reduce(
    (sum, index) => sum + next[index].remainingAmount,
    0,
  );
  const amount = Math.round((targetSum * percent) / 100);
  let allocated = 0;

  indexes.forEach((lineIndex, position) => {
    const isLast = position === indexes.length - 1;
    const share = isLast
      ? amount - allocated
      : Math.round((next[lineIndex].remainingAmount / targetSum) * amount);
    next[lineIndex] = {
      ...next[lineIndex],
      remainingAmount: next[lineIndex].remainingAmount - share,
    };
    allocated += share;
  });

  return { amount, lines: next };
}
