import { Ticket, X } from 'lucide-react'
import { findLiveCoupon } from '@/mocks/couponBook'
import { cn } from '@/shared/lib/cn'
import { useCheckoutStore } from './store'

export function AppliedPills({ align = 'start' }: { align?: 'start' | 'end' }) {
  const preview = useCheckoutStore((s) => s.preview)
  const couponCode = useCheckoutStore((s) => s.couponCode)
  const couponMessage = useCheckoutStore((s) => s.couponMessage)
  const setCouponCode = useCheckoutStore((s) => s.setCouponCode)
  const setCouponMessage = useCheckoutStore((s) => s.setCouponMessage)
  const live = couponCode ? findLiveCoupon(couponCode) : undefined
  const couponPct = live ? Math.round(live.discountPct * 100) : 15

  if (!preview) return null

  const couponOn = Boolean(preview.breakdown.coupon.applied && couponCode && couponMessage === null)
  const pills: { key: string; label: string; coupon?: boolean }[] = []
  if (preview.breakdown.category.applied) pills.push({ key: 'category', label: 'Categoría 10%' })
  if (preview.breakdown.volume.applied) pills.push({ key: 'volume', label: 'Volumen 5%' })
  if (couponOn && couponCode) pills.push({ key: 'coupon', label: `${couponCode} ${couponPct}%`, coupon: true })

  if (pills.length === 0) return null

  return (
    <ul
      className={cn('m-0 flex list-none flex-wrap gap-1.5 p-0', align === 'end' && 'justify-end')}
      aria-label="Cupones aplicados"
    >
      {pills.map((pill) => (
        <li key={pill.key}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-2.5 py-1 text-[0.6875rem] font-medium tracking-[0.04em] text-sage">
            {pill.coupon ? <Ticket className="size-3" aria-hidden /> : null}
            {pill.label}
            {pill.coupon ? (
              <button
                type="button"
                className="grid size-4 place-items-center rounded-full text-sage hover:bg-sage/15"
                aria-label={`Quitar cupón ${couponCode}`}
                onClick={() => {
                  setCouponCode(undefined)
                  setCouponMessage(null)
                }}
              >
                <X className="size-3" />
              </button>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  )
}
