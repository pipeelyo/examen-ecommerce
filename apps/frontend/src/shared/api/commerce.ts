import { apiRequest } from './client'
import type {
  CheckoutRequestDto,
  CheckoutResponseDto,
  CouponValidDto,
  OrderDto,
  ProductDto,
} from '@/shared/types'

export function getProducts(): Promise<ProductDto[]> {
  return apiRequest('/api/v1/products')
}

export function getCoupon(code: string): Promise<CouponValidDto> {
  return apiRequest(`/api/v1/coupons/${encodeURIComponent(code)}`)
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
