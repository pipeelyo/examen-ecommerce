import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PRODUCTS } from '@/mocks/seed'
import { useCouponBook } from '@/mocks/couponBook'
import { useCartStore } from '@/modules/cart/store'
import type { ProductDraft } from '@/mocks/catalogBook'
import type { ProductDto } from '@/shared/types'
import { ProductDesk } from './ProductDesk'
import { Toaster } from '@/shared/ui/sonner'

let catalog: ProductDto[] = []

vi.mock('@/shared/api/commerce', () => ({
  getProducts: () => Promise.resolve(catalog.map((product) => ({ ...product }))),
  getCategories: () =>
    Promise.resolve([
      { id: 'cat-tech', name: 'Tecnología' },
      { id: 'cat-libros', name: 'Libros' },
      { id: 'cat-muebles', name: 'Muebles' },
      { id: 'cat-hogar', name: 'Hogar' },
      { id: 'cat-juguetes', name: 'Juguetería' },
      { id: 'cat-ropa', name: 'Ropa' },
    ]),
  createProduct: (draft: ProductDraft) => {
    const created: ProductDto = {
      id: `p-${draft.name
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')}`,
      name: draft.name,
      category: draft.category,
      price: draft.price,
      stock: draft.stock,
    }
    catalog = [...catalog, created]
    return Promise.resolve(created)
  },
  updateProduct: (productId: string, draft: ProductDraft) => {
    catalog = catalog.map((product) =>
      product.id === productId
        ? { ...product, name: draft.name, category: draft.category, price: draft.price }
        : product,
    )
    const updated = catalog.find((product) => product.id === productId)
    if (!updated) throw new Error('missing product')
    return Promise.resolve(updated)
  },
  adjustProductStock: (productId: string, delta: number) => {
    catalog = catalog.map((product) =>
      product.id === productId ? { ...product, stock: product.stock + delta } : product,
    )
    const updated = catalog.find((product) => product.id === productId)
    if (!updated) throw new Error('missing product')
    return Promise.resolve(updated)
  },
  deleteProduct: (productId: string) => {
    const removed = catalog.find((product) => product.id === productId)
    if (!removed) throw new Error('missing product')
    catalog = catalog.filter((product) => product.id !== productId)
    return Promise.resolve(removed)
  },
}))

function rowFor(id: string) {
  const cell = screen.getByText(id)
  const row = cell.closest('tr')
  if (!row) throw new Error(`missing row for ${id}`)
  return row
}

describe('ProductDesk', () => {
  beforeEach(() => {
    catalog = PRODUCTS.map((product) => ({ ...product }))
    localStorage.clear()
  })

  it('summarizes catalog value, stock and category mix in the left column', async () => {
    render(<ProductDesk />)
    expect(await screen.findByText('Silla no tiene existencias.')).toBeInTheDocument()
    const summary = screen.getByRole('complementary', { name: 'Resumen del módulo' })
    expect(within(summary).getByText('Valor en existencias')).toBeInTheDocument()
    expect(within(summary).getByText('Piezas')).toBeInTheDocument()
    expect(within(summary).getByText('Unidades')).toBeInTheDocument()
    expect(within(summary).getByText('Agotadas')).toBeInTheDocument()
    expect(within(summary).getByText('En sala')).toBeInTheDocument()
    expect(within(summary).getByText('Categorías')).toBeInTheDocument()
    expect(within(summary).getByText('Ticket medio')).toBeInTheDocument()
    expect(within(summary).getByText('Por categoría')).toBeInTheDocument()
    expect(within(summary).getByText('Tecnología')).toBeInTheDocument()
  })

  it('restocks a sold-out piece only after confirming the new quantity', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Toaster />
        <ProductDesk />
      </>,
    )
    expect(await screen.findByText('Sin stock')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Agregar stock de Silla' }))
    expect(screen.getByText('0 → 1 sin confirmar')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmar stock de Silla' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Stock de Silla confirmado')
    expect(screen.queryByText('Sin stock')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Stock de Silla')).toHaveTextContent('1')
  })

  it('creates a piece that GET /products will expose', async () => {
    const user = userEvent.setup()
    render(<ProductDesk />)
    await screen.findByText('p-laptop')
    await user.click(screen.getByRole('button', { name: 'Nueva pieza' }))
    expect(await screen.findByRole('option', { name: 'Juguetería' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nombre'), 'Auriculares')
    await user.clear(screen.getByLabelText('Precio USD'))
    await user.type(screen.getByLabelText('Precio USD'), '80')
    await user.clear(screen.getByLabelText('Stock'))
    await user.type(screen.getByLabelText('Stock'), '4')
    await user.click(screen.getByRole('button', { name: 'Crear pieza' }))
    expect(await screen.findByText('Auriculares')).toBeInTheDocument()
    expect(screen.getByText('p-auriculares')).toBeInTheDocument()
  })

  it('edits name and price of an existing piece', async () => {
    const user = userEvent.setup()
    render(<ProductDesk />)
    await screen.findByText('p-libro')
    await user.click(within(rowFor('p-libro')).getByRole('button', { name: 'Editar Libro' }))
    const name = screen.getByLabelText('Nombre')
    await user.clear(name)
    await user.type(name, 'Novela')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Novela')).toBeInTheDocument()
    expect(screen.getByText('p-libro')).toBeInTheDocument()
  })

  it('deletes a piece, drops it from the cart, and unlinks coupons', async () => {
    const user = userEvent.setup()
    const laptop = PRODUCTS[0]
    if (!laptop) throw new Error('seed laptop missing')
    useCartStore.getState().add(laptop)
    expect(useCouponBook.getState().coupons[0]?.productIds).toContain('p-laptop')

    render(<ProductDesk />)
    await screen.findByText('p-laptop')
    await user.click(within(rowFor('p-laptop')).getByRole('button', { name: 'Eliminar Laptop' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar pieza' }))

    expect(await screen.findByRole('status')).toHaveTextContent('WELCOME2026')
    expect(screen.queryByText('p-laptop')).not.toBeInTheDocument()
    expect(useCartStore.getState().lines['p-laptop']).toBeUndefined()
    expect(useCouponBook.getState().coupons.find((coupon) => coupon.code === 'WELCOME2026')?.productIds).toEqual([])
  })

  it('loads categories from the API and shows a chosen icon in the listing', async () => {
    const user = userEvent.setup()
    render(<ProductDesk />)
    await screen.findByText('p-laptop')
    expect(within(rowFor('p-laptop')).getByLabelText('Icono Tecnología')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Nueva pieza' }))
    expect(await screen.findByRole('option', { name: 'Juguetería' })).toBeInTheDocument()
    expect(screen.getByLabelText('Categoría')).toHaveDisplayValue('Tecnología')
    await user.type(screen.getByLabelText('Nombre'), 'Peluche')
    await user.clear(screen.getByLabelText('Precio USD'))
    await user.type(screen.getByLabelText('Precio USD'), '25')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Juguetería')
    await user.click(screen.getByRole('button', { name: 'Icono Juguetería' }))
    await user.click(screen.getByRole('button', { name: 'Crear pieza' }))

    expect(await screen.findByText('Peluche')).toBeInTheDocument()
    expect(within(rowFor('p-peluche')).getByLabelText('Icono Juguetería')).toBeInTheDocument()
  })
})
