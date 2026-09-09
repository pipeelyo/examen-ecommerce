import { appendAudit } from '@/mocks/auditBook'
import { useCatalogBook, type ProductDraft } from '@/mocks/catalogBook'
import { useCouponBook } from '@/mocks/couponBook'
import { useCartStore } from '@/modules/cart/store'
import type { ProductDto } from '@/shared/types'

export function persistProduct(draft: ProductDraft, actor: string, current?: ProductDto): ProductDto {
  if (current) {
    const updated = useCatalogBook.getState().update(current.id, draft)
    if (!updated) return current
    useCartStore.getState().syncProduct(updated)
    appendAudit({
      entity_name: 'products',
      operation: 'UPDATE',
      row_pk: updated.id,
      actor,
      old_data: { name: current.name, category: current.category, price: current.price, stock: current.stock },
      new_data: { name: updated.name, category: updated.category, price: updated.price, stock: updated.stock },
    })
    return updated
  }
  const created = useCatalogBook.getState().add(draft)
  appendAudit({
    entity_name: 'products',
    operation: 'INSERT',
    row_pk: created.id,
    actor,
    old_data: null,
    new_data: { name: created.name, category: created.category, price: created.price, stock: created.stock },
  })
  return created
}

export function purgeProduct(productId: string, actor: string): { name: string; couponCodes: string[] } | undefined {
  const removed = useCatalogBook.getState().remove(productId)
  if (!removed) return undefined
  const detached = useCouponBook.getState().detachProduct(productId)
  useCartStore.getState().remove(productId)
  appendAudit({
    entity_name: 'products',
    operation: 'DELETE',
    row_pk: removed.id,
    actor,
    old_data: { name: removed.name, category: removed.category, price: removed.price, stock: removed.stock },
    new_data: null,
  })
  for (const link of detached) {
    appendAudit({
      entity_name: 'coupons',
      operation: 'UPDATE',
      row_pk: link.code,
      actor,
      old_data: { productIds: link.oldIds },
      new_data: { productIds: link.newIds },
    })
  }
  return { name: removed.name, couponCodes: detached.map((link) => link.code) }
}
