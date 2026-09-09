import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductDto } from '@/shared/types'
import { useCheckoutStore } from '@/modules/checkout/store'
import { useCartStore } from '@/modules/cart/store'
import { ProductGrid } from './ProductGrid'

let stock: number

vi.mock('@/shared/api/commerce', () => ({
  getProducts: (): Promise<ProductDto[]> =>
    Promise.resolve([{ id: 'p-silla', name: 'Silla', category: 'Muebles', price: 349, stock }]),
}))

describe('ProductGrid', () => {
  beforeEach(() => {
    stock = 5
    useCartStore.setState({ lines: {}, sheetOpen: false, pulse: null })
    useCheckoutStore.setState({ orderId: null, preview: null, previewError: null })
  })

  it('recarga el catalogo cuando se confirma un pedido, para que el stock no quede pegado', async () => {
    render(<ProductGrid />)
    expect((await screen.findAllByText('5 disponibles')).length).toBeGreaterThan(0)

    // El checkout ya redujo el stock en el backend — simula lo que
    // CheckoutConfirm hace al confirmar (setOrderId) y lo que devolveria
    // un GET /products fresco.
    stock = 0
    useCheckoutStore.setState({ orderId: 'order-1' })

    expect((await screen.findAllByText('Agotado')).length).toBeGreaterThan(0)
    expect(screen.queryByText('5 disponibles')).not.toBeInTheDocument()
  })
})
