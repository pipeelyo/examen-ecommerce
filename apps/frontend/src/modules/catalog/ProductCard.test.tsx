import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductDto } from '@/shared/types'
import { useCartStore } from '@/modules/cart/store'
import { ProductCard } from './ProductCard'

const PRODUCT: ProductDto = {
  id: 'p-silla',
  name: 'Silla',
  category: 'Muebles',
  price: 349,
  stock: 5,
}

describe('ProductCard', () => {
  beforeEach(() => {
    useCartStore.setState({ lines: {}, sheetOpen: false, pulse: null })
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('scrolls itself into view when it gets added to the cart', async () => {
    const user = userEvent.setup()
    render(<ProductCard product={PRODUCT} />)

    const [button] = screen.getAllByRole('button', { name: 'Agregar Silla' })
    await user.click(button!)

    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' })
    })
  })

  it('does not scroll on first render, only after an actual add', () => {
    render(<ProductCard product={PRODUCT} />)
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })
})
