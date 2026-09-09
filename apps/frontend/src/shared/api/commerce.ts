import { apiRequest } from './client'
import type {
  CheckoutRequestDto,
  CheckoutResponseDto,
  CouponDto,
  CouponValidDto,
  CreateCouponDto,
  OrderDto,
  ProductDto,
  UpdateCouponDto,
} from '@/shared/types'
import type { ProductDraft } from '@/mocks/catalogBook'
import { displayCategoryName, storageCategoryName } from '@/modules/catalog/categories'

export interface CatalogCategory {
  id: string
  name: string
}

function skuFromName(name: string): string {
  const slug =
    name
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 16) || 'SKU'
  return `${slug}-${Date.now().toString(36)}`.slice(0, 32)
}

export function getProducts(): Promise<ProductDto[]> {
  return apiRequest('/api/v1/products')
}

export async function getCategories(): Promise<CatalogCategory[]> {
  const rows = await apiRequest<CatalogCategory[]>('/api/v1/categories')
  return rows.map((row) => ({ ...row, name: displayCategoryName(row.name) }))
}

export async function createProduct(draft: ProductDraft): Promise<ProductDto> {
  const categoryId = await resolveCategoryId(draft.category)
  return apiRequest('/api/v1/products', {
    method: 'POST',
    body: JSON.stringify({
      sku: skuFromName(draft.name),
      name: draft.name,
      unitPrice: draft.price,
      categoryId,
      stock: draft.stock,
    }),
  })
}

export async function updateProduct(productId: string, draft: ProductDraft): Promise<ProductDto> {
  const categoryId = await resolveCategoryId(draft.category)
  return apiRequest(`/api/v1/products/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: draft.name,
      unitPrice: draft.price,
      categoryId,
    }),
  })
}

export function adjustProductStock(productId: string, delta: number): Promise<ProductDto> {
  return apiRequest(`/api/v1/products/${encodeURIComponent(productId)}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ delta }),
  })
}

export function deleteProduct(productId: string): Promise<ProductDto> {
  return apiRequest(`/api/v1/products/${encodeURIComponent(productId)}`, { method: 'DELETE' })
}

async function resolveCategoryId(displayName: string): Promise<string> {
  const categories = await getCategories()
  const stored = storageCategoryName(displayName)
  const match = categories.find(
    (category) => category.name === displayName || category.name === stored,
  )
  if (!match) {
    throw new Error(`No existe la categoría ${displayName}`)
  }
  return match.id
}

export function getCoupon(code: string): Promise<CouponValidDto> {
  return apiRequest(`/api/v1/coupons/${encodeURIComponent(code)}`)
}

function withDisplayCategory(coupon: CouponDto): CouponDto {
  return coupon.categoryName ? { ...coupon, categoryName: displayCategoryName(coupon.categoryName) } : coupon
}

export async function getCoupons(): Promise<CouponDto[]> {
  const rows = await apiRequest<CouponDto[]>('/api/v1/coupons')
  return rows.map(withDisplayCategory)
}

export async function createCoupon(input: CreateCouponDto): Promise<CouponDto> {
  const created = await apiRequest<CouponDto>('/api/v1/coupons', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      categoryName: input.categoryName ? storageCategoryName(input.categoryName) : undefined,
    }),
  })
  return withDisplayCategory(created)
}

export async function updateCoupon(id: string, input: UpdateCouponDto): Promise<CouponDto> {
  const updated = await apiRequest<CouponDto>(`/api/v1/coupons/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return withDisplayCategory(updated)
}

export function deleteCoupon(id: string): Promise<void> {
  return apiRequest(`/api/v1/coupons/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function previewCheckout(body: CheckoutRequestDto): Promise<CheckoutResponseDto> {
  return apiRequest('/api/v1/checkout/preview', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function confirmCheckout(body: CheckoutRequestDto): Promise<OrderDto> {
  return apiRequest('/api/v1/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getOrder(id: string): Promise<OrderDto> {
  return apiRequest(`/api/v1/orders/${encodeURIComponent(id)}`)
}
