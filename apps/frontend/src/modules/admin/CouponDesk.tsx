import { useMemo, useState } from 'react'
import { CircleCheck, CirclePause, Clock, Scan, Store, Ticket } from 'lucide-react'
import { appendAudit } from '@/mocks/auditBook'
import { useCatalogBook } from '@/mocks/catalogBook'
import { useCouponBook } from '@/mocks/couponBook'
import { useAuthStore } from '@/modules/auth/store'
import type { CouponRecord } from '@/mocks/seed'
import { Button } from '@/shared/ui/Button'
import { CheckField, FieldActions } from '@/shared/ui/Field'
import { AdminDialog } from './AdminDialog'
import { CouponCalendar } from './CouponCalendar'
import { ModuleInsight, ModuleStage, TablePane } from './AdminFrame'

function statusOf(coupon: CouponRecord, now: Date): 'Vencido' | 'Pausado' | 'Vigente' {
  if (new Date(coupon.expiresAt) <= now) return 'Vencido'
  if (!coupon.active) return 'Pausado'
  return 'Vigente'
}

function scopeLabel(coupon: CouponRecord, names: Map<string, string>): string {
  if (coupon.productIds.length === 0) return 'Catálogo'
  return coupon.productIds.map((id) => names.get(id) ?? id).join(', ')
}

function StatusMark({ status }: { status: ReturnType<typeof statusOf> }) {
  const Icon = status === 'Vigente' ? CircleCheck : status === 'Pausado' ? CirclePause : Clock
  const tone = status === 'Vigente' ? 'text-sage' : status === 'Pausado' ? 'text-muted' : 'text-danger'
  return (
    <span className={`inline-flex items-center gap-1.5 ${tone}`}>
      <Icon className="size-4" aria-hidden />
      {status}
    </span>
  )
}

export function CouponDesk() {
  const coupons = useCouponBook((s) => s.coupons)
  const products = useCatalogBook((s) => s.products)
  const toggleActive = useCouponBook((s) => s.toggleActive)
  const setProductIds = useCouponBook((s) => s.setProductIds)
  const actor = useAuthStore((s) => s.email)
  const now = new Date()
  const [scopeFor, setScopeFor] = useState<CouponRecord | null>(null)
  const names = new Map(products.map((product) => [product.id, product.name]))

  const insight = useMemo(() => {
    const clock = new Date()
    const live = coupons.filter((coupon) => statusOf(coupon, clock) === 'Vigente')
    const paused = coupons.filter((coupon) => statusOf(coupon, clock) === 'Pausado').length
    const expired = coupons.filter((coupon) => statusOf(coupon, clock) === 'Vencido').length
    const scoped = live.filter((coupon) => coupon.productIds.length > 0).length
    const catalog = live.filter((coupon) => coupon.productIds.length === 0).length
    const narrative =
      live.length === 0
        ? 'Ningún código opera ahora.'
        : scoped > 0 && catalog === 0
          ? 'El vigente cubre piezas, no el catálogo.'
          : undefined
    return {
      hero: String(live.length),
      unit: live.length === 1 ? 'Cupón vigente' : 'Cupones vigentes',
      narrative,
      tone: live.length === 0 ? ('danger' as const) : ('sage' as const),
      figures: [
        { label: 'Códigos', value: coupons.length },
        { label: 'En pausa', value: paused },
        { label: 'Vencidos', value: expired, warn: expired > 0 },
        { label: 'Catálogo', value: catalog },
        { label: 'Acotados', value: scoped },
        { label: 'Vigentes', value: live.length },
      ],
    }
  }, [coupons])

  function flip(coupon: CouponRecord) {
    toggleActive(coupon.code)
    appendAudit({
      entity_name: 'coupons',
      operation: 'UPDATE',
      row_pk: coupon.code,
      actor,
      old_data: { active: coupon.active },
      new_data: { active: !coupon.active },
    })
  }

  function saveScope(coupon: CouponRecord, productIds: string[]) {
    setProductIds(coupon.code, productIds)
    appendAudit({
      entity_name: 'coupons',
      operation: 'UPDATE',
      row_pk: coupon.code,
      actor,
      old_data: { productIds: coupon.productIds },
      new_data: { productIds },
    })
    setScopeFor(null)
  }

  return (
    <>
    <div className="flex min-h-0 flex-1 flex-col">
    <ModuleStage
      icon={Ticket}
      titleId="coupon-desk-title"
      title="Libro de cupones"
      aside={
        <ModuleInsight {...insight}>
          <CouponCalendar coupons={coupons} />
        </ModuleInsight>
      }
    >
      <TablePane>
        <table className="atelier-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descuento</th>
                <th>Piezas</th>
                <th>Vence</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const expired = new Date(coupon.expiresAt) <= now
                const status = statusOf(coupon, now)
                return (
                  <tr key={coupon.code}>
                    <td>
                      <span className="inline-flex items-center gap-2 font-medium">
                        <Ticket className="size-4 text-muted" aria-hidden />
                        {coupon.code}
                      </span>
                    </td>
                    <td className="tabular-nums">{Math.round(coupon.discountPct * 100)}%</td>
                    <td>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-left underline decoration-line underline-offset-4"
                        onClick={() => setScopeFor(coupon)}
                      >
                        {coupon.productIds.length === 0 ? (
                          <Store className="size-3.5 text-muted" aria-hidden />
                        ) : (
                          <Scan className="size-3.5 text-muted" aria-hidden />
                        )}
                        {scopeLabel(coupon, names)}
                      </button>
                    </td>
                    <td className="tabular-nums">{coupon.expiresAt.slice(0, 10)}</td>
                    <td>
                      <StatusMark status={status} />
                    </td>
                    <td>
                      {expired ? (
                        <span className="text-muted">Sin acción</span>
                      ) : (
                        <Button type="button" variant="ghost" size="sm" onClick={() => flip(coupon)}>
                          {coupon.active ? (
                            <>
                              <CirclePause className="size-3.5" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <CircleCheck className="size-3.5" />
                              Activar
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </TablePane>
    </ModuleStage>
    </div>
      <CouponScopeDialog coupon={scopeFor} products={products} onClose={() => setScopeFor(null)} onSave={saveScope} />
    </>
  )
}

function CouponScopeDialog({
  coupon,
  products,
  onClose,
  onSave,
}: {
  coupon: CouponRecord | null
  products: Array<{ id: string; name: string }>
  onClose: () => void
  onSave: (coupon: CouponRecord, productIds: string[]) => void
}) {
  const selected = new Set(coupon?.productIds ?? [])

  return (
    <AdminDialog open={coupon !== null} title={coupon ? `Piezas de ${coupon.code}` : 'Piezas'} onClose={onClose}>
      {coupon ? (
        <form
          key={coupon.code}
          className="flex flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            const box = new FormData(event.currentTarget)
            onSave(coupon, box.getAll('productId').map(String))
          }}
        >
          <p className="text-[0.9375rem] leading-relaxed text-muted">
            Vacío = todo el catálogo. El preview solo aplica el cupón si el carrito trae alguna de estas piezas.
          </p>
          <ul className="mt-5 flex flex-col gap-2">
            {products.map((product) => (
              <li key={product.id}>
                <CheckField name="productId" value={product.id} defaultChecked={selected.has(product.id)}>
                  <span className="flex min-w-0 items-baseline justify-between gap-3">
                    <span className="font-medium">{product.name}</span>
                    <span className="type-caption">{product.id}</span>
                  </span>
                </CheckField>
              </li>
            ))}
          </ul>
          <FieldActions>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar alcance</Button>
          </FieldActions>
        </form>
      ) : null}
    </AdminDialog>
  )
}
