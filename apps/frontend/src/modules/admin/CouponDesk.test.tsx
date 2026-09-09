import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CouponDto } from '@/shared/types'
import { CouponDesk } from './CouponDesk'

const SEED: CouponDto[] = [
  {
    id: 'c-welcome',
    code: 'WELCOME2026',
    label: '15% en toda la compra',
    scope: 'GLOBAL',
    categoryName: null,
    discountPercent: 15,
    active: true,
    validFrom: null,
    validTo: '2027-12-31T23:59:59.000Z',
  },
  {
    id: 'c-expired',
    code: 'EXPIRED2025',
    label: 'Cupón vencido',
    scope: 'GLOBAL',
    categoryName: null,
    discountPercent: 15,
    active: true,
    validFrom: null,
    validTo: '2025-12-31T23:59:59.000Z',
  },
  {
    id: 'c-taller',
    code: 'TALLER2026',
    label: '10% en Tecnología',
    scope: 'CATEGORY',
    categoryName: 'Tecnología',
    discountPercent: 10,
    active: true,
    validFrom: null,
    validTo: '2026-11-30T23:59:59.000Z',
  },
  {
    id: 'c-hogar',
    code: 'HOGAR2026',
    label: '12% en Hogar',
    scope: 'CATEGORY',
    categoryName: 'Hogar',
    discountPercent: 12,
    active: true,
    validFrom: null,
    validTo: '2026-09-30T23:59:59.000Z',
  },
  {
    id: 'c-pausa',
    code: 'PAUSA2026',
    label: '20% en pausa',
    scope: 'GLOBAL',
    categoryName: null,
    discountPercent: 20,
    active: false,
    validFrom: null,
    validTo: '2027-06-30T23:59:59.000Z',
  },
]

let coupons: CouponDto[] = []

vi.mock('@/shared/api/commerce', () => ({
  getCoupons: () => Promise.resolve(coupons.map((coupon) => ({ ...coupon }))),
  getCategories: () =>
    Promise.resolve([
      { id: 'cat-tech', name: 'Tecnología' },
      { id: 'cat-hogar', name: 'Hogar' },
    ]),
  createCoupon: (input: { code: string; label: string; scope: 'GLOBAL' | 'CATEGORY'; categoryName?: string; discountPercent: number; validFrom?: string; validTo?: string }) => {
    const created: CouponDto = {
      id: `c-${input.code.toLowerCase()}`,
      code: input.code,
      label: input.label,
      scope: input.scope,
      categoryName: input.categoryName ?? null,
      discountPercent: input.discountPercent,
      active: true,
      validFrom: input.validFrom ?? null,
      validTo: input.validTo ?? null,
    }
    coupons = [...coupons, created]
    return Promise.resolve(created)
  },
  updateCoupon: (id: string, input: Partial<CouponDto>) => {
    coupons = coupons.map((coupon) => (coupon.id === id ? { ...coupon, ...input } : coupon))
    const updated = coupons.find((coupon) => coupon.id === id)
    if (!updated) throw new Error('missing coupon')
    return Promise.resolve(updated)
  },
  deleteCoupon: (id: string) => {
    coupons = coupons.filter((coupon) => coupon.id !== id)
    return Promise.resolve()
  },
}))

async function couponRow(code: string) {
  const table = await screen.findByRole('table')
  const cell = await within(table).findByText(code)
  const row = cell.closest('tr')
  if (!row) throw new Error(`missing row for ${code}`)
  return row
}

describe('CouponDesk', () => {
  beforeEach(() => {
    coupons = SEED.map((coupon) => ({ ...coupon }))
  })

  it('pauses a live coupon without removing it from the book', async () => {
    const user = userEvent.setup()
    render(<CouponDesk />)
    const row = await couponRow('WELCOME2026')
    expect(within(row).getByText('Vigente')).toBeInTheDocument()
    await user.click(within(row).getByRole('button', { name: 'Pausar' }))
    expect(await within(row).findByText('Pausado')).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Activar' })).toBeInTheDocument()
  })

  it('shows coupon validity on a calendar instead of the status mix', async () => {
    const user = userEvent.setup()
    render(<CouponDesk />)
    await couponRow('WELCOME2026')
    const summary = screen.getByRole('complementary', { name: 'Resumen del módulo' })
    expect(within(summary).queryByText('Por estado')).not.toBeInTheDocument()
    expect(within(summary).getByText('Vigencias')).toBeInTheDocument()
    expect(within(summary).getByText('WELCOME2026')).toBeInTheDocument()
    expect(within(summary).getByText(/hasta 2027-12-31/)).toBeInTheDocument()
    for (const code of ['WELCOME2026', 'EXPIRED2025', 'TALLER2026', 'HOGAR2026', 'PAUSA2026']) {
      expect(within(screen.getByRole('table')).getByText(code)).toBeInTheDocument()
    }

    await user.click(within(summary).getByRole('button', { name: /EXPIRED2025/ }))
    expect(within(summary).getByText(/diciembre de 2025/i)).toBeInTheDocument()
    expect(within(summary).getByText(/2025-12-31: EXPIRED2025/)).toBeInTheDocument()
  })

  it('creates a global coupon that GET /coupons will expose', async () => {
    const user = userEvent.setup()
    render(<CouponDesk />)
    await couponRow('WELCOME2026')
    await user.click(screen.getByRole('button', { name: 'Nuevo cupón' }))
    await user.type(screen.getByLabelText('Código'), 'BLACKFRIDAY')
    await user.type(screen.getByLabelText('Etiqueta'), '25% Black Friday')
    await user.clear(screen.getByLabelText('Descuento %'))
    await user.type(screen.getByLabelText('Descuento %'), '25')
    await user.click(screen.getByRole('button', { name: 'Crear cupón' }))
    const row = await couponRow('BLACKFRIDAY')
    expect(within(row).getByText('Catálogo')).toBeInTheDocument()
  })

  it('creates a category-scoped coupon', async () => {
    const user = userEvent.setup()
    render(<CouponDesk />)
    await couponRow('WELCOME2026')
    await user.click(screen.getByRole('button', { name: 'Nuevo cupón' }))
    await user.type(screen.getByLabelText('Código'), 'TECH50')
    await user.type(screen.getByLabelText('Etiqueta'), '50% en tecnología')
    await user.selectOptions(screen.getByLabelText('Alcance'), 'CATEGORY')
    await user.selectOptions(await screen.findByLabelText('Categoría'), 'Tecnología')
    await user.clear(screen.getByLabelText('Descuento %'))
    await user.type(screen.getByLabelText('Descuento %'), '50')
    await user.click(screen.getByRole('button', { name: 'Crear cupón' }))
    const row = await couponRow('TECH50')
    expect(within(row).getByText('Tecnología')).toBeInTheDocument()
  })

  it('deletes a coupon', async () => {
    const user = userEvent.setup()
    render(<CouponDesk />)
    const row = await couponRow('PAUSA2026')
    await user.click(within(row).getByRole('button', { name: 'Eliminar PAUSA2026' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar cupón' }))
    expect(await screen.findByRole('status')).toHaveTextContent('PAUSA2026')
    expect(screen.queryByText('PAUSA2026')).not.toBeInTheDocument()
  })
})
