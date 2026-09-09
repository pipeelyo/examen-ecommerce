import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { PRODUCTS } from '@/mocks/seed'
import { useAuthStore } from '@/modules/auth/store'
import { useCartStore } from '@/modules/cart/store'
import { useCheckoutStore } from '@/modules/checkout/store'
import type { CheckoutResponseDto } from '@/shared/types'

vi.mock('@/shared/api/commerce', () => ({
  getProducts: () => Promise.resolve(PRODUCTS),
  previewCheckout: () =>
    Promise.resolve({
      orderId: null,
      originalSubtotal: 780,
      breakdown: {
        category: { applied: true, amount: 75 },
        volume: { applied: true, amount: 35.25 },
        coupon: { applied: true, amount: 100.46 },
        cappedAt35: false,
      },
      totalDiscount: 210.71,
      effectiveDiscountPercentage: 27.01,
      finalTotal: 569.29,
    } satisfies CheckoutResponseDto),
  getCoupon: vi.fn(),
  confirmCheckout: vi.fn(),
  getOrder: vi.fn(),
}))

const laptop = PRODUCTS[0]
const mouse = PRODUCTS[1]
const libro = PRODUCTS[2]

if (!laptop || !mouse || !libro) {
  throw new Error('seed products missing')
}

describe('App store snapshots', () => {
  beforeEach(() => {
    useAuthStore.getState().enterBuyer()
    useCartStore.setState({ lines: {}, sheetOpen: false })
    useCheckoutStore.setState({
      couponCode: undefined,
      couponMessage: null,
      preview: null,
      previewError: null,
      orderId: null,
      confirmError: null,
      confirming: false,
      previewEpoch: 0,
    })
  })

  it('renders empty catalog without looping', () => {
    render(<App />)
    expect(screen.getByText('KataE1 - Ecommerce')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Piezas en sala' })).toBeInTheDocument()
  })

  it('renders a filled cart and open sheet without looping', () => {
    useCartStore.setState({
      lines: {
        [laptop.id]: { product: laptop, quantity: 1 },
        [mouse.id]: { product: mouse, quantity: 1 },
        [libro.id]: { product: libro, quantity: 1 },
      },
      sheetOpen: true,
    })
    useCheckoutStore.setState({
      couponCode: 'WELCOME2026',
      preview: {
        orderId: null,
        originalSubtotal: 780,
        breakdown: {
          category: { applied: true, amount: 75 },
          volume: { applied: true, amount: 35.25 },
          coupon: { applied: true, amount: 100.46 },
          cappedAt35: true,
        },
        totalDiscount: 210.71,
        effectiveDiscountPercentage: 27.01,
        finalTotal: 569.29,
      },
    })

    render(<App />)

    expect(screen.getAllByText('Laptop').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Confirmar pedido').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('¡Enhorabuena! Has alcanzado el límite máximo de ahorro permitido (35%).')
        .length,
    ).toBeGreaterThan(0)
  })
})
