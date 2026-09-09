import { Price } from '@/shared/ui/Price'
import type { CheckoutResponseDto, DiscountLineDto } from '@/shared/types'

function Row({
  label,
  amount,
  tone,
}: {
  label: string
  amount: number
  tone?: 'sage'
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
      <span className="text-muted">{label}</span>
      <Price amount={amount} className={tone === 'sage' ? 'tabular-nums text-sage' : 'tabular-nums'} />
    </div>
  )
}

function DiscountRow({
  label,
  line,
}: {
  label: string
  line: DiscountLineDto
}) {
  if (!line.applied) return null
  return <Row label={label} amount={-line.amount} tone="sage" />
}

export function DiscountBreakdown({
  preview,
  couponPct = 15,
}: {
  preview: CheckoutResponseDto
  couponPct?: number
}) {
  return (
    <div className="flex flex-col gap-1.5" data-testid="discount-breakdown">
      <Row label="Subtotal" amount={preview.originalSubtotal} />
      <DiscountRow label="Categoría" line={preview.breakdown.category} />
      <DiscountRow label="Volumen" line={preview.breakdown.volume} />
      <DiscountRow label={`Cupón ${couponPct}%`} line={preview.breakdown.coupon} />
      <Row label={`Ahorro (${preview.effectiveDiscountPercentage}%)`} amount={-preview.totalDiscount} tone="sage" />
      <div className="mt-2 flex flex-col items-end gap-1 border-t border-line pt-3">
        <span className="type-kicker">Total</span>
        <Price display amount={preview.finalTotal} className="text-[2.15rem] sm:text-[2.5rem]" />
      </div>
    </div>
  )
}
