import { describe, expect, it } from 'vitest'
import { calculateCheckout } from './engine'
import { COUPONS } from './seed'

const goldenCart = [
  { productId: 'p-laptop', quantity: 1, unitPrice: 700, category: 'Tecnología' },
  { productId: 'p-mouse', quantity: 1, unitPrice: 50, category: 'Tecnología' },
  { productId: 'p-libro', quantity: 1, unitPrice: 30, category: 'Libros' },
]

const now = new Date('2026-09-08T12:00:00.000Z')
const welcome = COUPONS.find((c) => c.code === 'WELCOME2026')
const expired = COUPONS.find((c) => c.code === 'EXPIRED2025')

if (!welcome || !expired) {
  throw new Error('seed coupons missing')
}

describe('calculateCheckout', () => {
  it('golden Laptop+Mouse+Libro+WELCOME2026 → 569.29', () => {
    const result = calculateCheckout({
      items: goldenCart,
      coupon: welcome,
      couponCode: 'WELCOME2026',
      now,
    })
    expect(result.originalSubtotal).toBe(780)
    expect(result.breakdown.category.amount).toBe(75)
    expect(result.breakdown.volume.amount).toBe(35.25)
    expect(result.breakdown.coupon.amount).toBe(100.46)
    expect(result.breakdown.cappedAt35).toBe(false)
    expect(result.effectiveDiscountPercentage).toBe(27.01)
    expect(result.finalTotal).toBe(569.29)
    expect(result.orderId).toBeNull()
  })

  it('marks INVALID_COUPON without breaking other lines', () => {
    const result = calculateCheckout({
      items: goldenCart,
      coupon: null,
      couponCode: 'NOSUCH',
      now,
    })
    expect(result.breakdown.coupon).toEqual({
      applied: false,
      amount: 0,
      reason: 'INVALID_COUPON',
    })
    expect(result.breakdown.category.applied).toBe(true)
    expect(result.finalTotal).toBe(669.75)
  })

  it('marks EXPIRED_COUPON and keeps the rest', () => {
    const result = calculateCheckout({
      items: goldenCart,
      coupon: expired,
      couponCode: 'EXPIRED2025',
      now,
    })
    expect(result.breakdown.coupon.reason).toBe('EXPIRED_COUPON')
    expect(result.breakdown.coupon.applied).toBe(false)
    expect(result.finalTotal).toBe(669.75)
  })

  it('rejects a product-scoped coupon when the cart has none of its pieces', () => {
    const result = calculateCheckout({
      items: [{ productId: 'p-libro', quantity: 1, unitPrice: 30, category: 'Libros' }],
      coupon: welcome,
      couponCode: 'WELCOME2026',
      now,
    })
    expect(result.breakdown.coupon).toEqual({
      applied: false,
      amount: 0,
      reason: 'INVALID_COUPON',
    })
    expect(result.finalTotal).toBe(30)
  })

  it('does not apply volume at or below $100 post-category', () => {
    const result = calculateCheckout({
      items: [{ productId: 'p-libro', quantity: 1, unitPrice: 30, category: 'Libros' }],
      now,
    })
    expect(result.breakdown.volume.applied).toBe(false)
    expect(result.finalTotal).toBe(30)
  })

  it('forceCap sets cappedAt35 and clamps to 65% of original', () => {
    const result = calculateCheckout({
      items: goldenCart,
      coupon: welcome,
      couponCode: 'WELCOME2026',
      forceCap: true,
      now,
    })
    expect(result.breakdown.cappedAt35).toBe(true)
    expect(result.finalTotal).toBe(507)
  })
})
