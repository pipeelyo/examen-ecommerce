import { createCoupon, deleteCoupon, updateCoupon } from '@/shared/api/commerce'
import type { CouponDto } from '@/shared/types'
import type { CouponDraft } from './CouponFormFields'

function toDateOrUndefined(value: string): string | undefined {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined
}

// Sin appendAudit: los triggers reales en coupon.coupons (trg_coupons_audit,
// ver sdd/services/08-real-database-and-auth.md §3) llenan audit._x27f_evt_trace
// solos — un eco local aquí quedaría escribiendo a un store que AuditLedger
// ya no lee (ver AuditLedger.tsx, ahora conectado a GET /admin/audit).
export async function persistCoupon(draft: CouponDraft, current?: CouponDto): Promise<CouponDto> {
  if (current) {
    return updateCoupon(current.id, {
      label: draft.label,
      discountPercent: draft.discountPercent,
      validFrom: toDateOrUndefined(draft.validFrom) ?? null,
      validTo: toDateOrUndefined(draft.validTo) ?? null,
    })
  }
  return createCoupon({
    code: draft.code,
    label: draft.label,
    scope: draft.scope,
    categoryName: draft.scope === 'CATEGORY' ? draft.categoryName : undefined,
    discountPercent: draft.discountPercent,
    validFrom: toDateOrUndefined(draft.validFrom),
    validTo: toDateOrUndefined(draft.validTo),
  })
}

export function togglePause(coupon: CouponDto): Promise<CouponDto> {
  return updateCoupon(coupon.id, { active: !coupon.active })
}

export function purgeCoupon(coupon: CouponDto): Promise<void> {
  return deleteCoupon(coupon.id)
}
