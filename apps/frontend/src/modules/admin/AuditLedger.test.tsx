import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AuditEventDto } from '@/shared/types'
import { AuditLedger } from './AuditLedger'

const SEED: AuditEventDto[] = [
  {
    id: 1,
    entity_name: 'coupons',
    operation: 'INSERT',
    row_pk: 'WELCOME2026',
    actor: 'liquibase-seed',
    old_data: null,
    new_data: { code: 'WELCOME2026', discountPct: 0.15, active: true },
    occurred_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    entity_name: 'coupons',
    operation: 'INSERT',
    row_pk: 'EXPIRED2025',
    actor: 'liquibase-seed',
    old_data: null,
    new_data: { code: 'EXPIRED2025', discountPct: 0.15, active: true },
    occurred_at: '2026-01-01T00:00:01.000Z',
  },
  {
    id: 3,
    entity_name: 'products',
    operation: 'UPDATE',
    row_pk: 'p-silla',
    actor: 'liquibase-seed',
    old_data: { stock: 1 },
    new_data: { stock: 0 },
    occurred_at: '2026-01-01T00:00:02.000Z',
  },
]

vi.mock('@/shared/api/commerce', () => ({
  getAuditEvents: () => Promise.resolve(SEED.map((event) => ({ ...event }))),
}))

describe('AuditLedger', () => {
  it('shows a pie of operation share instead of the mix bars', async () => {
    render(<AuditLedger />)
    const summary = screen.getByRole('complementary', { name: 'Resumen del módulo' })
    await within(summary).findByText('Por operación')
    expect(within(summary).getByRole('img', { name: /torta de operaciones/i })).toBeInTheDocument()
    expect(within(summary).getAllByText('66.7%').length).toBeGreaterThan(0)
    expect(within(summary).getByText(/2 · INSERT/)).toBeInTheDocument()
    expect(within(summary).getByText(/1 · UPDATE/)).toBeInTheDocument()
    expect(within(summary).getByText(/0 · DELETE/)).toBeInTheDocument()
  })

  it('renders the real rows fetched from GET /admin/audit', async () => {
    render(<AuditLedger />)
    expect(await screen.findByText('WELCOME2026')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('p-silla')).toBeInTheDocument()
  })
})
