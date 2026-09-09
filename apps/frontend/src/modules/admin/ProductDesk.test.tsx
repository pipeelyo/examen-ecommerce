import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PRODUCTS } from '@/mocks/seed'
import { useCouponBook } from '@/mocks/couponBook'
import { useCartStore } from '@/modules/cart/store'
import { ProductDesk } from './ProductDesk'
import { Toaster } from '@/shared/ui/sonner'

function rowFor(id: string) {
  const cell = screen.getByText(id)
  const row = cell.closest('tr')
  if (!row) throw new Error(`missing row for ${id}`)
  return row
}

describe('ProductDesk', () => {
  it('summarizes catalog value, stock and category mix in the left column', () => {
    render(<ProductDesk />)
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
    expect(within(summary).getByText('Silla no tiene existencias.')).toBeInTheDocument()
  })

  it('restocks a sold-out piece only after confirming the new quantity', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Toaster />
        <ProductDesk />
      </>,
    )
    expect(screen.getByText('Sin stock')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Agregar stock de Silla' }))
    expect(screen.getByText('0 → 1 sin confirmar')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmar stock de Silla' }))
    expect(screen.queryByText('Sin stock')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Stock de Silla')).toHaveTextContent('1')
    expect(screen.getByRole('status')).toHaveTextContent('Stock de Silla confirmado')
  })

  it('creates a piece that GET /products will expose', async () => {
    const user = userEvent.setup()
    render(<ProductDesk />)
    await user.click(screen.getByRole('button', { name: 'Nueva pieza' }))
    await user.type(screen.getByLabelText('Nombre'), 'Auriculares')
    await user.clear(screen.getByLabelText('Precio USD'))
    await user.type(screen.getByLabelText('Precio USD'), '80')
    await user.clear(screen.getByLabelText('Stock'))
    await user.type(screen.getByLabelText('Stock'), '4')
    await user.click(screen.getByRole('button', { name: 'Crear pieza' }))
    expect(screen.getByText('Auriculares')).toBeInTheDocument()
    expect(screen.getByText('p-auriculares')).toBeInTheDocument()
  })

  it('edits name and price of an existing piece', async () => {
    const user = userEvent.setup()
    render(<ProductDesk />)
    await user.click(within(rowFor('p-libro')).getByRole('button', { name: 'Editar Libro' }))
    const name = screen.getByLabelText('Nombre')
    await user.clear(name)
    await user.type(name, 'Novela')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(screen.getByText('Novela')).toBeInTheDocument()
    expect(screen.getByText('p-libro')).toBeInTheDocument()
  })

  it('deletes a piece, drops it from the cart, and unlinks coupons', async () => {
    const user = userEvent.setup()
    const laptop = PRODUCTS[0]
    if (!laptop) throw new Error('seed laptop missing')
    useCartStore.getState().add(laptop)
    expect(useCouponBook.getState().coupons[0]?.productIds).toContain('p-laptop')

    render(<ProductDesk />)
    await user.click(within(rowFor('p-laptop')).getByRole('button', { name: 'Eliminar Laptop' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar pieza' }))

    expect(screen.queryByText('p-laptop')).not.toBeInTheDocument()
    expect(useCartStore.getState().lines['p-laptop']).toBeUndefined()
    expect(useCouponBook.getState().coupons.find((coupon) => coupon.code === 'WELCOME2026')?.productIds).toEqual([])
    expect(screen.getByRole('status')).toHaveTextContent('WELCOME2026')
  })
})
