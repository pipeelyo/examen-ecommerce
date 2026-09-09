import { useEffect, useMemo, useState } from 'react'
import { CircleCheck, CirclePause, Clock, Plus, Store, Scan, Ticket, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getCoupons } from '@/shared/api/commerce'
import { ApiError } from '@/shared/api/client'
import type { CouponDto } from '@/shared/types'
import { Button } from '@/shared/ui/Button'
import { AdminDialog } from './AdminDialog'
import { CouponCalendar, type CalendarCoupon } from './CouponCalendar'
import { CouponFormFields } from './CouponFormFields'
import { persistCoupon, purgeCoupon, togglePause } from './couponMutations'
import { ModuleInsight, ModuleStage, TablePane } from './AdminFrame'

function statusOf(coupon: CouponDto, now: Date): 'Vencido' | 'Pausado' | 'Vigente' {
  if (coupon.validTo && new Date(coupon.validTo) <= now) return 'Vencido'
  if (!coupon.active) return 'Pausado'
  return 'Vigente'
}

function scopeLabel(coupon: CouponDto): string {
  return coupon.scope === 'CATEGORY' ? (coupon.categoryName ?? 'Categoría') : 'Catálogo'
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
  const [coupons, setCoupons] = useState<CouponDto[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const now = new Date()
  const [editor, setEditor] = useState<CouponDto | 'new' | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CouponDto | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function refresh() {
    const data = await getCoupons()
    setCoupons(data)
    setLoadError(null)
  }

  useEffect(() => {
    void refresh().catch(() => setLoadError('No se pudieron cargar los cupones'))
  }, [])

  const calendarCoupons: CalendarCoupon[] = coupons
    .filter((coupon): coupon is CouponDto & { validTo: string } => coupon.validTo !== null)
    .map((coupon) => ({ code: coupon.code, active: coupon.active, validTo: coupon.validTo }))

  const insight = useMemo(() => {
    const clock = new Date()
    const live = coupons.filter((coupon) => statusOf(coupon, clock) === 'Vigente')
    const paused = coupons.filter((coupon) => statusOf(coupon, clock) === 'Pausado').length
    const expired = coupons.filter((coupon) => statusOf(coupon, clock) === 'Vencido').length
    const scoped = live.filter((coupon) => coupon.scope === 'CATEGORY').length
    const catalog = live.filter((coupon) => coupon.scope === 'GLOBAL').length
    const narrative =
      live.length === 0
        ? 'Ningún código opera ahora.'
        : scoped > 0 && catalog === 0
          ? 'El vigente cubre categorías, no el catálogo.'
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
        { label: 'Por categoría', value: scoped },
        { label: 'Vigentes', value: live.length },
      ],
    }
  }, [coupons])

  async function save(draft: Parameters<typeof persistCoupon>[0]) {
    const current = editor === 'new' || editor === null ? undefined : editor
    try {
      await persistCoupon(draft, current)
      await refresh()
      setEditor(null)
      const message = current ? `Se actualizó ${draft.code || current.code}.` : `Se creó ${draft.code}.`
      setNotice(message)
      toast.success(message)
    } catch (err) {
      const message = err instanceof ApiError ? err.body.message : 'No se pudo guardar el cupón'
      setNotice(message)
      toast.error(message)
    }
  }

  async function flip(coupon: CouponDto) {
    try {
      await togglePause(coupon)
      await refresh()
    } catch (err) {
      const message = err instanceof ApiError ? err.body.message : 'No se pudo cambiar el estado del cupón'
      toast.error(message)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await purgeCoupon(pendingDelete)
      const message = `${pendingDelete.code} se eliminó.`
      setPendingDelete(null)
      await refresh()
      setNotice(message)
      toast.success(message)
    } catch (err) {
      const message = err instanceof ApiError ? err.body.message : 'No se pudo eliminar el cupón'
      toast.error(message)
    }
  }

  return (
    <>
    <div className="flex min-h-0 flex-1 flex-col">
    <ModuleStage
      icon={Ticket}
      titleId="coupon-desk-title"
      title="Libro de cupones"
      action={
        <Button type="button" onClick={() => setEditor('new')}>
          <Plus className="size-4" />
          Nuevo cupón
        </Button>
      }
      aside={
        <ModuleInsight {...insight}>
          <CouponCalendar coupons={calendarCoupons} />
        </ModuleInsight>
      }
    >
      {loadError ? (
        <p role="alert" className="shrink-0 px-6 pt-4 text-[0.9375rem] text-danger">
          {loadError}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="shrink-0 px-6 pt-4 text-[0.9375rem] text-sage">
          {notice}
        </p>
      ) : null}
      <TablePane>
        <table className="atelier-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descuento</th>
                <th>Alcance</th>
                <th>Vence</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const expired = coupon.validTo !== null && new Date(coupon.validTo) <= now
                const status = statusOf(coupon, now)
                return (
                  <tr key={coupon.id}>
                    <td>
                      <span className="inline-flex items-center gap-2 font-medium">
                        <Ticket className="size-4 text-muted" aria-hidden />
                        {coupon.code}
                      </span>
                    </td>
                    <td className="tabular-nums">{coupon.discountPercent}%</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        {coupon.scope === 'GLOBAL' ? (
                          <Store className="size-3.5 text-muted" aria-hidden />
                        ) : (
                          <Scan className="size-3.5 text-muted" aria-hidden />
                        )}
                        {scopeLabel(coupon)}
                      </span>
                    </td>
                    <td className="tabular-nums">{coupon.validTo ? coupon.validTo.slice(0, 10) : 'Sin vencimiento'}</td>
                    <td>
                      <StatusMark status={status} />
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        {expired ? (
                          <span className="text-muted">Sin acción</span>
                        ) : (
                          <Button type="button" variant="ghost" size="sm" onClick={() => void flip(coupon)}>
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
                        <Button
                          type="button"
                          variant="glass"
                          size="icon"
                          className="size-9 max-md:size-11"
                          data-tone="danger"
                          aria-label={`Eliminar ${coupon.code}`}
                          onClick={() => setPendingDelete(coupon)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </TablePane>
    </ModuleStage>
    </div>
      <AdminDialog
        open={editor !== null}
        title={editor === 'new' || editor === null ? 'Nuevo cupón' : `Editar ${editor.code}`}
        onClose={() => setEditor(null)}
      >
        <CouponFormFields
          key={editor === 'new' || editor === null ? 'new' : editor.id}
          coupon={editor === 'new' || editor === null ? undefined : editor}
          onCancel={() => setEditor(null)}
          onSave={save}
        />
      </AdminDialog>
      <AdminDialog
        open={pendingDelete !== null}
        title={pendingDelete ? `¿Eliminar ${pendingDelete.code}?` : 'Eliminar'}
        onClose={() => setPendingDelete(null)}
      >
        <p className="text-[1.0625rem] leading-relaxed text-muted">
          El código <span className="text-ink">{pendingDelete?.code}</span> deja de existir — cualquier carrito con
          este cupón aplicado dejará de recibir el descuento.
        </p>
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={() => void confirmDelete()}>
            <Trash2 className="size-4" />
            Eliminar cupón
          </Button>
        </div>
      </AdminDialog>
    </>
  )
}
