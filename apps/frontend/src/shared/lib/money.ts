export function toCents(usd: number): number {
  return Math.round(usd * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

export function moneyOf(price: number, quantity = 1): number {
  return fromCents(toCents(price) * quantity)
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
