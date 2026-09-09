import { fromCents, toCents } from '@/shared/lib/money'
import type {
  CheckoutResponseDto,
  DiscountLineDto,
  DiscountReason,
} from '@/shared/types'
import {
  CAP_RATIO,
  TECH_CATEGORY,
  VOLUME_THRESHOLD_USD,
  type CouponRecord,
} from './seed'

export interface EngineLine {
  productId: string
  quantity: number
  unitPrice: number
  category: string
}

function none(reason?: DiscountReason): DiscountLineDto {
  return { applied: false, amount: 0, reason }
}

function applied(cents: number): DiscountLineDto {
  return { applied: true, amount: fromCents(cents) }
}

function percentOf(amountCents: number, pct: number): number {
  return Math.round(amountCents * pct)
}

function resolveCoupon(
  coupon: CouponRecord | null | undefined,
  couponCode: string | undefined,
  now: Date,
  items: EngineLine[],
): { line: DiscountLineDto; pct: number } {
  if (!couponCode) return { line: none('NOT_APPLICABLE'), pct: 0 }
  if (!coupon) return { line: none('INVALID_COUPON'), pct: 0 }
  if (!coupon.active) return { line: none('INVALID_COUPON'), pct: 0 }
  if (new Date(coupon.expiresAt) <= now) return { line: none('EXPIRED_COUPON'), pct: 0 }
  const scoped = coupon.productIds ?? []
  if (scoped.length > 0 && !items.some((line) => scoped.includes(line.productId))) {
    return { line: none('INVALID_COUPON'), pct: 0 }
  }
  return { line: applied(0), pct: coupon.discountPct }
}

export function calculateCheckout(params: {
  items: EngineLine[]
  coupon?: CouponRecord | null
  couponCode?: string
  forceCap?: boolean
  now?: Date
}): Omit<CheckoutResponseDto, 'orderId'> & { orderId: null } {
  const now = params.now ?? new Date()
  const originalCents = params.items.reduce(
    (sum, line) => sum + toCents(line.unitPrice) * line.quantity,
    0,
  )

  const techCents = params.items
    .filter((line) => line.category === TECH_CATEGORY)
    .reduce((sum, line) => sum + toCents(line.unitPrice) * line.quantity, 0)

  const categoryCents = percentOf(techCents, 0.1)
  const afterCategory = originalCents - categoryCents

  const volumeApplies = fromCents(afterCategory) > VOLUME_THRESHOLD_USD
  const volumeCents = volumeApplies ? percentOf(afterCategory, 0.05) : 0
  const afterVolume = afterCategory - volumeCents

  const couponResolved = resolveCoupon(params.coupon, params.couponCode, now, params.items)
  const couponCents = couponResolved.pct > 0 ? percentOf(afterVolume, couponResolved.pct) : 0
  const afterCoupon = afterVolume - couponCents

  const bruteDiscount = originalCents - afterCoupon
  const hitsCap =
    originalCents > 0 && bruteDiscount / originalCents > CAP_RATIO
  const shouldCap = hitsCap || Boolean(params.forceCap)

  const finalCents = shouldCap
    ? Math.round(originalCents * (1 - CAP_RATIO))
    : afterCoupon
  const totalDiscountCents = originalCents - finalCents
  const effective =
    originalCents === 0
      ? 0
      : Number(((totalDiscountCents / originalCents) * 100).toFixed(2))

  const couponLine: DiscountLineDto = couponResolved.pct > 0
    ? applied(couponCents)
    : couponResolved.line

  return {
    orderId: null,
    originalSubtotal: fromCents(originalCents),
    breakdown: {
      category: categoryCents > 0 ? applied(categoryCents) : none('NOT_APPLICABLE'),
      volume: volumeApplies ? applied(volumeCents) : none('NOT_APPLICABLE'),
      coupon: couponLine,
      cappedAt35: shouldCap,
    },
    totalDiscount: fromCents(totalDiscountCents),
    effectiveDiscountPercentage: effective,
    finalTotal: fromCents(finalCents),
  }
}
