import { create } from 'zustand'

export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE'

export interface AuditEvent {
  id: number
  entity_name: string
  operation: AuditOperation
  row_pk: string
  actor: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  occurred_at: string
}

type AuditDraft = Omit<AuditEvent, 'id' | 'occurred_at'> & { occurred_at?: string }

function seedTrace(): AuditEvent[] {
  return [
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
}

interface AuditBookState {
  events: AuditEvent[]
  nextId: number
  append: (draft: AuditDraft) => AuditEvent
  reset: () => void
}

const seed = seedTrace()

export const useAuditBook = create<AuditBookState>((set, get) => ({
  events: seed,
  nextId: seed.length + 1,
  append: (draft) => {
    const event: AuditEvent = {
      ...draft,
      id: get().nextId,
      occurred_at: draft.occurred_at ?? new Date().toISOString(),
    }
    set({ events: [event, ...get().events], nextId: event.id + 1 })
    return event
  },
  reset: () => set({ events: seedTrace(), nextId: seed.length + 1 }),
}))

export function appendAudit(draft: AuditDraft): AuditEvent {
  return useAuditBook.getState().append(draft)
}
