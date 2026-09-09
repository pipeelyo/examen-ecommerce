export interface ProductDto {
  id: string
  name: string
  category: string
  price: number
  stock: number
}

export interface CouponValidDto {
  code: string
  valid: boolean
  reason?: 'INVALID' | 'EXPIRED'
  discountPct?: number
}

export type CouponScope = 'GLOBAL' | 'CATEGORY'

/** Shape admin de coupon-service (GET/POST/PATCH /admin/coupons vía api-gateway). */
export interface CouponDto {
  id: string
  code: string
  label: string
  scope: CouponScope
  categoryName: string | null
  discountPercent: number
  active: boolean
  validFrom: string | null
  validTo: string | null
}

export interface CreateCouponDto {
  code: string
  label: string
  scope: CouponScope
  categoryName?: string
  discountPercent: number
  validFrom?: string
  validTo?: string
}

export interface UpdateCouponDto {
  label?: string
  active?: boolean
  discountPercent?: number
  validFrom?: string | null
  validTo?: string | null
}

export interface CartItemInputDto {
  productId: string
  quantity: number
}

export interface CheckoutRequestDto {
  items: CartItemInputDto[]
  couponCode?: string
}

export type DiscountReason = 'NOT_APPLICABLE' | 'INVALID_COUPON' | 'EXPIRED_COUPON'

export interface DiscountLineDto {
  applied: boolean
  amount: number
  reason?: DiscountReason
}

export interface CheckoutResponseDto {
  orderId: string | null
  originalSubtotal: number
  breakdown: {
    category: DiscountLineDto
    volume: DiscountLineDto
    coupon: DiscountLineDto
    cappedAt35: boolean
  }
  totalDiscount: number
  effectiveDiscountPercentage: number
  finalTotal: number
}

export interface OrderDto extends CheckoutResponseDto {
  orderId: string
  status: 'CONFIRMED'
  createdAt: string
}

export interface ApiErrorDto {
  code: string
  message: string
  fields?: Record<string, string>
  details?: Record<string, string>
}
