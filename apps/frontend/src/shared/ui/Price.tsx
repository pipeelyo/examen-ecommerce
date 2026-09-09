import { formatUsd, toCents } from '@/shared/lib/money'
import { cn } from '@/shared/lib/cn'

interface PriceProps {
  amount: number
  className?: string
  display?: boolean
}

export function Price({ amount, className, display = false }: PriceProps) {
  if (!display) {
    return <span className={cn('tabular-nums tracking-tight', className)}>{formatUsd(amount)}</span>
  }

  const cents = toCents(amount)
  const major = Math.trunc(Math.abs(cents) / 100).toLocaleString('en-US')
  const minor = String(Math.abs(cents) % 100).padStart(2, '0')

  return (
    <span className={cn('font-display leading-none tracking-[-0.04em] text-ink', className)}>
      {cents < 0 ? <span className="mr-[0.04em]">−</span> : null}
      <span className="mr-[0.12em] align-top font-body text-[0.48em] font-medium text-muted">$</span>
      <span className="tabular-nums">{major}</span>
      <span className="font-display text-[0.48em] tracking-[-0.02em] text-muted">.{minor}</span>
    </span>
  )
}
