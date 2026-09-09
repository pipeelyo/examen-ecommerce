import { useEffect, useMemo, useState } from 'react'
import { Package, Pencil, Plus, ScrollText, ShoppingBag, Ticket, Trash2 } from 'lucide-react'
import { getAuditEvents } from '@/shared/api/commerce'
import type { AuditEventDto } from '@/shared/types'
import { cn } from '@/shared/lib/cn'
import { ModuleInsight, ModuleStage, TablePane } from './AdminFrame'
import { AuditOperationPie } from './AuditOperationPie'

const ENTITY_FILTERS = ['todos', 'products', 'coupons', 'orders'] as const
type EntityFilter = (typeof ENTITY_FILTERS)[number]

const ENTITY_ICON = {
  products: Package,
  coupons: Ticket,
  orders: ShoppingBag,
} as const

const OP_ICON = {
  INSERT: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
} as const

function iconForEntity(name: string) {
  if (name === 'products' || name === 'coupons' || name === 'orders') return ENTITY_ICON[name]
  return ScrollText
}

function iconForOp(operation: AuditEventDto['operation']) {
  return OP_ICON[operation]
}

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function payloadPreview(event: AuditEventDto): string {
  const payload = event.new_data ?? event.old_data
  if (!payload) return '—'
  return Object.entries(payload)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ')
}

export function AuditLedger() {
  const [events, setEvents] = useState<AuditEventDto[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<EntityFilter>('todos')

  useEffect(() => {
    void getAuditEvents()
      .then(setEvents)
      .catch(() => setLoadError('No se pudo cargar la bitácora'))
  }, [])

  const visible = useMemo(
    () => (filter === 'todos' ? events : events.filter((event) => event.entity_name === filter)),
    [events, filter],
  )

  const insight = useMemo(() => {
    const inserts = events.filter((event) => event.operation === 'INSERT').length
    const updates = events.filter((event) => event.operation === 'UPDATE').length
    const deletes = events.filter((event) => event.operation === 'DELETE').length
    const latest = events.reduce<typeof events[0] | undefined>(
      (best, event) => (!best || event.occurred_at > best.occurred_at ? event : best),
      undefined,
    )
    const narrative = latest
      ? `Lo último: ${latest.operation} sobre ${latest.entity_name}.`
      : 'La traza aún no tiene movimientos.'
    const products = events.filter((event) => event.entity_name === 'products').length
    const coupons = events.filter((event) => event.entity_name === 'coupons').length
    const orders = events.filter((event) => event.entity_name === 'orders').length
    return {
      hero: String(events.length),
      unit: events.length === 1 ? 'Movimiento en la traza' : 'Movimientos en la traza',
      narrative,
      figures: [
        { label: 'Productos', value: products },
        { label: 'Cupones', value: coupons },
        { label: 'Pedidos', value: orders },
        { label: 'Altas', value: inserts },
        { label: 'Cambios', value: updates },
        { label: 'Bajas', value: deletes, warn: deletes > 0 },
      ],
    }
  }, [events])

  return (
    <ModuleStage
      icon={ScrollText}
      titleId="audit-ledger-title"
      title="Bitácora de auditoría"
      aside={
        <ModuleInsight {...insight}>
          <AuditOperationPie events={events} />
        </ModuleInsight>
      }
    >
      {loadError ? (
        <p role="alert" className="shrink-0 px-6 pt-4 text-[0.9375rem] text-danger">
          {loadError}
        </p>
      ) : null}
      <div className="flex shrink-0 flex-wrap gap-2 px-5 pt-4" role="group" aria-label="Filtrar entidad">
          {ENTITY_FILTERS.map((item) => {
            const active = item === filter
            const Icon = item === 'todos' ? ScrollText : ENTITY_ICON[item]
            return (
              <button
                key={item}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(item)}
                className={cn(
                  'inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[0.875rem] capitalize transition-[color,background-color,border-color] duration-200 ease-out',
                  active ? 'bg-ink text-card' : 'border border-line bg-card text-muted hover:text-ink',
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {item}
              </button>
            )
          })}
        </div>
        <TablePane>
          <table className="atelier-table">
            <thead>
              <tr>
                <th>Cuando</th>
                <th>Entidad</th>
                <th>Op</th>
                <th>Clave</th>
                <th>Actor</th>
                <th>Cambio</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((event) => {
                const EntityIcon = iconForEntity(event.entity_name)
                const OpIcon = iconForOp(event.operation)
                return (
                  <tr key={event.id}>
                    <td className="tabular-nums text-muted">{formatWhen(event.occurred_at)}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        <EntityIcon className="size-3.5 text-muted" aria-hidden />
                        {event.entity_name}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <OpIcon className="size-3.5 text-muted" aria-hidden />
                        {event.operation}
                      </span>
                    </td>
                    <td className="font-mono type-caption text-ink">{event.row_pk}</td>
                    <td>{event.actor ?? '—'}</td>
                    <td className="text-muted">{payloadPreview(event)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TablePane>
    </ModuleStage>
  )
}
