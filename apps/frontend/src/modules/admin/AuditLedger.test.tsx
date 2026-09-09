import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuditLedger } from './AuditLedger'

describe('AuditLedger', () => {
  it('shows a pie of operation share instead of the mix bars', () => {
    render(<AuditLedger />)
    const summary = screen.getByRole('complementary', { name: 'Resumen del módulo' })
    expect(within(summary).getByText('Por operación')).toBeInTheDocument()
    expect(within(summary).getByRole('img', { name: /torta de operaciones/i })).toBeInTheDocument()
    expect(within(summary).getAllByText('66.7%').length).toBeGreaterThan(0)
    expect(within(summary).getByText(/2 · INSERT/)).toBeInTheDocument()
    expect(within(summary).getByText(/1 · UPDATE/)).toBeInTheDocument()
    expect(within(summary).getByText(/0 · DELETE/)).toBeInTheDocument()
  })
})
