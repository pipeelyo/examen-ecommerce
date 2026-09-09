import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PRODUCTS } from '@/mocks/seed'
import { useAuthStore } from '@/modules/auth/store'
import type { ProductDto } from '@/shared/types'
import { AdminShell } from './AdminShell'

let catalog: ProductDto[] = []

vi.mock('@/shared/api/commerce', () => ({
  getProducts: () => Promise.resolve(catalog.map((product) => ({ ...product }))),
  getCategories: () => Promise.resolve([]),
}))

describe('AdminShell', () => {
  beforeEach(() => {
    catalog = PRODUCTS.map((product) => ({ ...product }))
    useAuthStore.getState().enterAdmin()
  })

  it('switches modules from the mobile nav bar', async () => {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    })
    const user = userEvent.setup()
    render(<AdminShell />)

    expect(screen.getByRole('navigation', { name: 'Barra de navegación' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Abrir menú' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cupones' }))
    expect(screen.getByRole('heading', { name: 'Libro de cupones' })).toBeInTheDocument()
  })

  it('keeps SDD admin modules in the desktop sidebar', async () => {
    const user = userEvent.setup()
    render(<AdminShell />)

    expect(screen.getByRole('navigation', { name: 'Módulos de gestión' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Catálogo y existencias' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Resumen del módulo' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Gestión' })).toBeInTheDocument()
    expect(await screen.findByText('p-laptop')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cupones' }))
    expect(screen.getByRole('heading', { name: 'Libro de cupones' })).toBeInTheDocument()
    expect(screen.getAllByText('WELCOME2026').length).toBeGreaterThan(0)

    const welcomeRow = within(screen.getByRole('table')).getByText('WELCOME2026').closest('tr')
    if (!welcomeRow) throw new Error('missing WELCOME2026 row')
    await user.click(within(welcomeRow).getByRole('button', { name: 'Pausar' }))
    await user.click(screen.getByRole('button', { name: 'Bitácora' }))
    expect(screen.getByRole('heading', { name: 'Bitácora de auditoría' })).toBeInTheDocument()
    expect(screen.getAllByText('WELCOME2026').length).toBeGreaterThan(1)
    expect(screen.getByText(/active: false/)).toBeInTheDocument()
  })
})
