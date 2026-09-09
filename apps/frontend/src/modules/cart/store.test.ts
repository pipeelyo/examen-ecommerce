import { beforeEach, describe, expect, it } from 'vitest'
import { selectSubtotal, useCartStore } from './store'
import type { ProductDto } from '@/shared/types'

const laptop: ProductDto = {
  id: 'p-laptop',
  name: 'Laptop',
  category: 'Tecnología',
  price: 700,
  stock: 2,
}

const chair: ProductDto = {
  id: 'p-silla',
  name: 'Silla',
  category: 'Muebles',
  price: 349,
  stock: 0,
}

describe('cart store', () => {
  beforeEach(() => {
    useCartStore.setState({ lines: {}, sheetOpen: false })
  })

  it('adds items and exposes subtotal via selector', () => {
    expect(useCartStore.getState().add(laptop)).toBe(true)
    expect(useCartStore.getState().add(laptop)).toBe(true)
    expect(useCartStore.getState().add(laptop)).toBe(false)
    expect(selectSubtotal(useCartStore.getState())).toBe(1400)
  })

  it('does not add zero-stock products', () => {
    expect(useCartStore.getState().add(chair)).toBe(false)
    expect(selectSubtotal(useCartStore.getState())).toBe(0)
  })

  it('syncs an edited product and drops it when stock hits zero', () => {
    useCartStore.getState().add(laptop)
    useCartStore.getState().add(laptop)
    useCartStore.getState().syncProduct({ ...laptop, price: 650, stock: 1 })
    expect(useCartStore.getState().lines['p-laptop']?.quantity).toBe(1)
    expect(useCartStore.getState().lines['p-laptop']?.product.price).toBe(650)
    useCartStore.getState().syncProduct({ ...laptop, stock: 0 })
    expect(useCartStore.getState().lines['p-laptop']).toBeUndefined()
  })

  it('decrement removes the line at 1', () => {
    useCartStore.getState().add(laptop)
    useCartStore.getState().decrement('p-laptop')
    expect(useCartStore.getState().lines['p-laptop']).toBeUndefined()
  })
})
