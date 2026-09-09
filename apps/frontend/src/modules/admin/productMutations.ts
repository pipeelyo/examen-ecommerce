import { appendAudit } from '@/mocks/auditBook'
import { type ProductDraft } from '@/mocks/catalogBook'
import { useCouponBook } from '@/mocks/couponBook'
import { useCartStore } from '@/modules/cart/store'
import {
  adjustProductStock,
  createProduct,
  deleteProduct,
  updateProduct,
} from '@/shared/api/commerce'
import type { ProductDto } from '@/shared/types'
import { forgetProductIcon, iconIdForCategory, rememberProductIcon } from './productIcons'

export async function persistProduct(
  draft: ProductDraft,
  actor: string,
  current?: ProductDto,
): Promise<ProductDto> {
  if (current) {
    let updated = await updateProduct(current.id, draft)
    if (draft.stock !== current.stock) {
      const delta = draft.stock - current.stock
      if (delta !== 0) {
        updated = await adjustProductStock(current.id, delta)
      }
    }
    rememberProductIcon(updated.id, draft.icon ?? iconIdForCategory(updated.category))
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
  const created = await createProduct(draft)
  rememberProductIcon(created.id, draft.icon ?? iconIdForCategory(created.category))
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

export async function purgeProduct(
  productId: string,
  actor: string,
): Promise<{ name: string; couponCodes: string[] } | undefined> {
  const removed = await deleteProduct(productId)
  forgetProductIcon(productId)
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
