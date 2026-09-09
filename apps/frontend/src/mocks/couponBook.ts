import { create } from 'zustand'
import { COUPONS, type CouponRecord } from './seed'

function seedCopy(): CouponRecord[] {
  return COUPONS.map((coupon) => ({ ...coupon, productIds: [...coupon.productIds] }))
}

export interface CouponDetach {
  code: string
  oldIds: string[]
  newIds: string[]
}

interface CouponBookState {
  coupons: CouponRecord[]
  toggleActive: (code: string) => void
  setProductIds: (code: string, productIds: string[]) => void
  detachProduct: (productId: string) => CouponDetach[]
  reset: () => void
}

export const useCouponBook = create<CouponBookState>((set, get) => ({
  coupons: seedCopy(),
  toggleActive: (code) => {
    const normalized = code.trim().toUpperCase()
    set({
      coupons: get().coupons.map((coupon) =>
        coupon.code === normalized ? { ...coupon, active: !coupon.active } : coupon,
      ),
    })
  },
  setProductIds: (code, productIds) => {
    const normalized = code.trim().toUpperCase()
    const unique = [...new Set(productIds)]
    set({
      coupons: get().coupons.map((coupon) =>
        coupon.code === normalized ? { ...coupon, productIds: unique } : coupon,
      ),
    })
  },
  detachProduct: (productId) => {
    const detached: CouponDetach[] = []
    set({
      coupons: get().coupons.map((coupon) => {
        if (!coupon.productIds.includes(productId)) return coupon
        const next = { ...coupon, productIds: coupon.productIds.filter((id) => id !== productId) }
        detached.push({ code: coupon.code, oldIds: coupon.productIds, newIds: next.productIds })
        return next
      }),
    })
    return detached
  },
  reset: () => set({ coupons: seedCopy() }),
}))

export function findLiveCoupon(code: string): CouponRecord | undefined {
  const normalized = code.trim().toUpperCase()
  return useCouponBook.getState().coupons.find((coupon) => coupon.code === normalized)
}
