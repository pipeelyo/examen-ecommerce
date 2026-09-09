import { http, HttpResponse } from 'msw'
import type { ApiErrorDto, CheckoutRequestDto, OrderDto, ProductDto } from '@/shared/types'
import { appendAudit } from './auditBook'
import { useCatalogBook } from './catalogBook'
import { getForceCap } from './demoFlags'
import { findLiveCoupon } from './couponBook'
import { calculateCheckout } from './engine'
import { DEMO_BEARER } from './seed'

const orders = new Map<string, OrderDto>()

function productsNow(): ProductDto[] {
  return useCatalogBook.getState().products.map((product) => ({ ...product }))
}

function productById(productId: string): ProductDto | undefined {
  return useCatalogBook.getState().products.find((product) => product.id === productId)
}

function findCoupon(code: string) {
  return findLiveCoupon(code)
}

function error(status: number, body: ApiErrorDto) {
  return HttpResponse.json(body, { status })
}

function readBearer(request: Request): string | null {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

function requireDemoAuth(request: Request) {
  const token = readBearer(request)
  if (token !== DEMO_BEARER) {
    return error(401, { code: 'UNAUTHORIZED', message: 'Bearer token required' })
  }
  return null
}

function parseCheckout(body: unknown): { ok: true; value: CheckoutRequestDto } | { ok: false; response: ReturnType<typeof error> } {
  if (!body || typeof body !== 'object') {
    return {
      ok: false,
      response: error(400, { code: 'VALIDATION_ERROR', message: 'Invalid body', fields: { items: 'required' } }),
    }
  }
  const { items, couponCode } = body as CheckoutRequestDto
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, response: error(422, { code: 'CART_EMPTY', message: 'Cart is empty' }) }
  }
  for (const item of items) {
    if (!item?.productId || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return {
        ok: false,
        response: error(400, {
          code: 'VALIDATION_ERROR',
          message: 'Invalid cart item',
          fields: { items: 'quantity must be an integer >= 1' },
        }),
      }
    }
  }
  return { ok: true, value: { items, couponCode } }
}

function buildEngineLines(items: CheckoutRequestDto['items']) {
  const lines = []
  for (const item of items) {
    const product = productById(item.productId)
    if (!product) {
      return { error: error(400, { code: 'VALIDATION_ERROR', message: 'Unknown product', fields: { items: item.productId } }) }
    }
    lines.push({
      productId: product.id,
      quantity: item.quantity,
      unitPrice: product.price,
      category: product.category,
    })
  }
  return { lines }
}

function checkStock(items: CheckoutRequestDto['items']) {
  for (const item of items) {
    const available = productById(item.productId)?.stock ?? 0
    if (item.quantity > available) {
      return error(409, {
        code: 'STOCK_INSUFFICIENT',
        message: 'Not enough stock',
        details: { productId: item.productId },
      })
    }
  }
  return null
}

function recordCheckoutAudit(order: OrderDto, items: CheckoutRequestDto['items'], before: ProductDto[]) {
  const actor = 'CUSTOMER'
  for (const item of items) {
    const previous = before.find((product) => product.id === item.productId)
    if (!previous) continue
    appendAudit({
      entity_name: 'products',
      operation: 'UPDATE',
      row_pk: item.productId,
      actor,
      old_data: { stock: previous.stock },
      new_data: { stock: previous.stock - item.quantity },
    })
  }
  appendAudit({
    entity_name: 'orders',
    operation: 'INSERT',
    row_pk: order.orderId,
    actor,
    old_data: null,
    new_data: { status: order.status, finalTotal: order.finalTotal },
  })
}

export const handlers = [
  http.get('/api/v1/products', () => HttpResponse.json(productsNow())),

  http.get('/api/v1/coupons/:code', ({ params }) => {
    const code = String(params.code)
    const coupon = findCoupon(code)
    if (!coupon) {
      return error(404, { code: 'NOT_FOUND', message: 'Coupon not found' })
    }
    const expired = new Date(coupon.expiresAt) <= new Date()
    if (!coupon.active || expired) {
      return HttpResponse.json({
        code: coupon.code,
        valid: false,
        reason: expired ? 'EXPIRED' : 'INVALID',
      })
    }
    return HttpResponse.json({
      code: coupon.code,
      valid: true,
      discountPct: coupon.discountPct,
    })
  }),

  http.post('/api/v1/checkout/preview', async ({ request }) => {
    const parsed = parseCheckout(await request.json())
    if (!parsed.ok) return parsed.response
    const built = buildEngineLines(parsed.value.items)
    if ('error' in built) return built.error
    const coupon = parsed.value.couponCode ? findCoupon(parsed.value.couponCode) ?? null : null
    return HttpResponse.json(
      calculateCheckout({
        items: built.lines,
        coupon,
        couponCode: parsed.value.couponCode,
        forceCap: getForceCap(),
      }),
    )
  }),

  http.post('/api/v1/checkout', async ({ request }) => {
    const unauthorized = requireDemoAuth(request)
    if (unauthorized) return unauthorized
    const parsed = parseCheckout(await request.json())
    if (!parsed.ok) return parsed.response
    const stockError = checkStock(parsed.value.items)
    if (stockError) return stockError
    const built = buildEngineLines(parsed.value.items)
    if ('error' in built) return built.error
    const coupon = parsed.value.couponCode ? findCoupon(parsed.value.couponCode) ?? null : null
    const preview = calculateCheckout({
      items: built.lines,
      coupon,
      couponCode: parsed.value.couponCode,
      forceCap: getForceCap(),
    })
    const snapshot = productsNow()
    useCatalogBook.getState().decrementStock(parsed.value.items)
    const orderId = crypto.randomUUID()
    const order: OrderDto = {
      ...preview,
      orderId,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    }
    orders.set(orderId, order)
    recordCheckoutAudit(order, parsed.value.items, snapshot)
    return HttpResponse.json(order, { status: 201 })
  }),

  http.get('/api/v1/orders/:id', ({ request, params }) => {
    const unauthorized = requireDemoAuth(request)
    if (unauthorized) return unauthorized
    const order = orders.get(String(params.id))
    if (!order) return error(404, { code: 'NOT_FOUND', message: 'Order not found' })
    return HttpResponse.json(order)
  }),
]
