import { appendAudit } from '@/mocks/auditBook'
import { createCoupon, deleteCoupon, updateCoupon } from '@/shared/api/commerce'
import type { CouponDto } from '@/shared/types'
import type { CouponDraft } from './CouponFormFields'

function toDateOrUndefined(value: string): string | undefined {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined
}

export async function persistCoupon(draft: CouponDraft, actor: string, current?: CouponDto): Promise<CouponDto> {
  if (current) {
    const updated = await updateCoupon(current.id, {
      label: draft.label,
      discountPercent: draft.discountPercent,
      validFrom: toDateOrUndefined(draft.validFrom) ?? null,
      validTo: toDateOrUndefined(draft.validTo) ?? null,
    })
    appendAudit({
      entity_name: 'coupons',
      operation: 'UPDATE',
      row_pk: updated.code,
      actor,
      old_data: { label: current.label, discountPercent: current.discountPercent, validFrom: current.validFrom, validTo: current.validTo },
      new_data: { label: updated.label, discountPercent: updated.discountPercent, validFrom: updated.validFrom, validTo: updated.validTo },
    })
    return updated
  }
  const created = await createCoupon({
    code: draft.code,
    label: draft.label,
    scope: draft.scope,
    categoryName: draft.scope === 'CATEGORY' ? draft.categoryName : undefined,
    discountPercent: draft.discountPercent,
    validFrom: toDateOrUndefined(draft.validFrom),
    validTo: toDateOrUndefined(draft.validTo),
  })
  appendAudit({
    entity_name: 'coupons',
    operation: 'INSERT',
    row_pk: created.code,
    actor,
    old_data: null,
    new_data: { label: created.label, scope: created.scope, categoryName: created.categoryName, discountPercent: created.discountPercent },
  })
  return created
}

export async function togglePause(coupon: CouponDto, actor: string): Promise<CouponDto> {
  const updated = await updateCoupon(coupon.id, { active: !coupon.active })
  appendAudit({
    entity_name: 'coupons',
    operation: 'UPDATE',
    row_pk: coupon.code,
    actor,
    old_data: { active: coupon.active },
    new_data: { active: updated.active },
  })
  return updated
}

export async function purgeCoupon(coupon: CouponDto, actor: string): Promise<void> {
  await deleteCoupon(coupon.id)
  appendAudit({
    entity_name: 'coupons',
    operation: 'DELETE',
    row_pk: coupon.code,
    actor,
    old_data: { label: coupon.label, scope: coupon.scope, discountPercent: coupon.discountPercent },
    new_data: null,
  })
}
