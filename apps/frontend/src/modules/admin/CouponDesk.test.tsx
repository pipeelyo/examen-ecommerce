import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CouponDesk } from './CouponDesk'

function couponRow(code: string) {
  const row = within(screen.getByRole('table')).getByText(code).closest('tr')
  if (!row) throw new Error(`missing row for ${code}`)
  return row
}

describe('CouponDesk', () => {
  it('pauses a live coupon without removing it from the book', async () => {
    const user = userEvent.setup()
    render(<CouponDesk />)
    const row = couponRow('WELCOME2026')
    expect(within(row).getByText('Vigente')).toBeInTheDocument()
    await user.click(within(row).getByRole('button', { name: 'Pausar' }))
    expect(within(row).getByText('Pausado')).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Activar' })).toBeInTheDocument()
  })

  it('shows coupon validity on a calendar instead of the status mix', async () => {
    const user = userEvent.setup()
    render(<CouponDesk />)
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
})
