import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProductFormFields } from './ProductFormFields'

vi.mock('@/shared/api/commerce', () => ({
  getCategories: vi.fn().mockResolvedValue([{ id: 'cat-hogar', name: 'Hogar' }]),
}))

describe('ProductFormFields — selector de icono', () => {
  it('marca el icono elegido con fondo solido, no con un anillo apenas visible', async () => {
    const user = userEvent.setup()
    render(<ProductFormFields onCancel={() => {}} onSave={() => {}} />)
    await screen.findByText('Hogar')

    const juguete = screen.getByRole('button', { name: 'Icono Juguetería' })
    const cpu = screen.getByRole('button', { name: 'Icono Tecnología' })

    // por defecto ninguno marcado como "elegido" hasta que se resuelve la
    // categoria inicial (que asigna cpu por default en carga)
    await user.click(juguete)

    expect(juguete).toHaveAttribute('aria-pressed', 'true')
    expect(juguete.className).toContain('bg-ink')
    expect(juguete.className).not.toContain('btn-glass')

    expect(cpu).toHaveAttribute('aria-pressed', 'false')
    expect(cpu.className).toContain('btn-glass')
    expect(cpu.className).not.toContain('bg-ink')
  })

  it('cambiar de icono mueve la marca, nunca dos elegidos a la vez', async () => {
    const user = userEvent.setup()
    render(<ProductFormFields onCancel={() => {}} onSave={() => {}} />)
    await screen.findByText('Hogar')

    await user.click(screen.getByRole('button', { name: 'Icono Muebles' }))
    await user.click(screen.getByRole('button', { name: 'Icono Ropa' }))

    expect(screen.getByRole('button', { name: 'Icono Ropa' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Icono Muebles' })).toHaveAttribute('aria-pressed', 'false')
  })
})
