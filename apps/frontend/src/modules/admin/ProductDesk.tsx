import { useState } from 'react'
import { Check, Layers, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCatalogBook } from '@/mocks/catalogBook'
import type { ProductDraft } from '@/mocks/catalogBook'
import { useAuthStore } from '@/modules/auth/store'
import type { ProductDto } from '@/shared/types'
import { formatUsd, fromCents, toCents } from '@/shared/lib/money'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import { AdminDialog } from './AdminDialog'
import { ModuleInsight, ModuleStage, TablePane } from './AdminFrame'
import { ProductFormFields } from './ProductFormFields'
import { persistProduct, purgeProduct } from './productMutations'

function DeskPrice({ amount }: { amount: number }) {
  const cents = toCents(amount)
  const major = Math.trunc(Math.abs(cents) / 100).toLocaleString('en-US')
  const minor = String(Math.abs(cents) % 100).padStart(2, '0')

  return (
    <p className="flex flex-col items-center">
      <span className="font-display text-[1.375rem] leading-none tracking-[-0.038em] text-ink">
        <span className="mr-[0.08em] align-top font-body text-[0.62em] font-medium text-muted">$</span>
        <span className="tabular-nums">{major}</span>
        <span className="font-display text-[0.55em] tracking-[-0.02em] text-muted">.{minor}</span>
      </span>
      <span className="type-kicker mt-1.5">por pieza</span>
    </p>
  )
}

function StockStepper({
  name,
  value,
  onChange,
}: {
  name: string
  value: number
  onChange: (next: number) => void
}) {
  return (
    <div className="btn-glass inline-flex w-fit items-center rounded-full" role="group" aria-label={`Stock de ${name}`}>
      <button
        type="button"
        className="flex size-9 items-center justify-center text-base"
        aria-label={`Quitar stock de ${name}`}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="min-w-7 text-center tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="flex size-9 items-center justify-center text-base"
        aria-label={`Agregar stock de ${name}`}
        disabled={value >= 999}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}

function ProductInsight({ products }: { products: ProductDto[] }) {
  const empty = products.filter((product) => product.stock === 0)
  const inStock = products.filter((product) => product.stock > 0)
  const units = products.reduce((sum, product) => sum + product.stock, 0)
  const valueCents = products.reduce((sum, product) => sum + toCents(product.price) * product.stock, 0)
  const value = fromCents(valueCents)
  const avgTicket =
    products.length === 0
      ? 0
      : fromCents(Math.round(products.reduce((sum, product) => sum + toCents(product.price), 0) / products.length))

  const byCategory = new Map<string, { skus: number; units: number; valueCents: number }>()
  for (const product of products) {
    const current = byCategory.get(product.category) ?? { skus: 0, units: 0, valueCents: 0 }
    current.skus += 1
    current.units += product.stock
    current.valueCents += toCents(product.price) * product.stock
    byCategory.set(product.category, current)
  }

  const names = empty.map((product) => product.name)
  const narrative =
    products.length === 0
      ? 'El libro está vacío.'
      : empty.length === 1
        ? `${names[0]} no tiene existencias.`
        : empty.length > 1
          ? `${names.join(', ')} no tienen existencias.`
          : undefined

  const parts = [...byCategory.entries()]
    .map(([label, stats]) => ({
      label,
      weight: stats.valueCents,
      hero: formatUsd(fromCents(stats.valueCents)),
      caption: `${stats.skus} · ${stats.units} uds`,
    }))
    .sort((left, right) => right.weight - left.weight)

  return (
    <ModuleInsight
      hero={formatUsd(value)}
      unit="Valor en existencias"
      narrative={narrative}
      tone={empty.length > 0 ? 'danger' : undefined}
      figures={[
        { label: 'Piezas', value: products.length },
        { label: 'Unidades', value: units },
        { label: 'Agotadas', value: empty.length, warn: empty.length > 0 },
        { label: 'En sala', value: inStock.length },
        { label: 'Categorías', value: byCategory.size },
        { label: 'Ticket medio', value: formatUsd(avgTicket) },
      ]}
      mix={{ title: 'Por categoría', parts }}
    />
  )
}

function StockEditor({
  product,
  onConfirm,
}: {
  product: ProductDto
  onConfirm: (next: number) => void
}) {
  const [draft, setDraft] = useState(product.stock)
  const dirty = draft !== product.stock

  return (
    <div className="flex w-full flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <StockStepper name={product.name} value={draft} onChange={setDraft} />
        {dirty ? (
          <Button
            type="button"
            variant="glass"
            size="icon"
            className="size-9 shrink-0"
            data-tone="sage"
            onClick={() => onConfirm(draft)}
            aria-label={`Confirmar stock de ${product.name}`}
          >
            <Check />
          </Button>
        ) : null}
      </div>
      <span className={cn('type-caption text-center', product.stock === 0 ? 'text-danger' : 'text-muted')}>
        {dirty
          ? `${product.stock} → ${draft} sin confirmar`
          : product.stock === 0
            ? 'Sin stock'
            : `${product.stock} uds`}
      </span>
    </div>
  )
}

export function ProductDesk() {
  const products = useCatalogBook((s) => s.products)
  const actor = useAuthStore((s) => s.email)
  const [editor, setEditor] = useState<ProductDto | 'new' | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ProductDto | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function save(draft: ProductDraft) {
    const current = editor === 'new' || editor === null ? undefined : editor
    persistProduct(draft, actor, current)
    setEditor(null)
    const message = current ? `Se actualizó ${draft.name}.` : `Se creó ${draft.name}.`
    setNotice(message)
    toast.success(message)
  }

  function confirmStock(product: ProductDto, next: number) {
    persistProduct({ ...product, stock: next }, actor, product)
    const message = `Stock de ${product.name} confirmado: ${product.stock} → ${next} uds`
    setNotice(message)
    toast.success('Stock confirmado', { description: message })
  }

  function confirmDelete() {
    if (!pendingDelete) return
    const result = purgeProduct(pendingDelete.id, actor)
    setPendingDelete(null)
    if (!result) return
    const couponNote =
      result.couponCodes.length > 0
        ? ` Cupones desasociados: ${result.couponCodes.join(', ')}.`
        : ' Ningún cupón apuntaba a esta pieza.'
    const message = `${result.name} salió del catálogo y de la bolsa.${couponNote}`
    setNotice(message)
    toast.success(message)
  }

  return (
    <>
    <div className="flex min-h-0 flex-1 flex-col">
    <ModuleStage
      icon={Package}
      titleId="product-desk-title"
      title="Catálogo y existencias"
      action={
        <Button type="button" onClick={() => setEditor('new')}>
          <Plus className="size-4" />
          Nueva pieza
        </Button>
      }
      aside={<ProductInsight products={products} />}
    >
      {notice ? (
        <p role="status" className="shrink-0 px-6 pt-4 text-[0.9375rem] text-sage">
          {notice}
        </p>
      ) : null}
      <TablePane>
        <table className="atelier-table">
          <thead>
            <tr>
              <th>Pieza</th>
              <th>Categoría</th>
              <th className="w-[24%]">Precio</th>
              <th className="w-[20%]">Existencias</th>
              <th className="w-28">Acciones</th>
            </tr>
          </thead>
          <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="flex items-start gap-2.5">
                      <Package className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="type-caption mt-0.5">{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <Layers className="size-3.5 text-muted" aria-hidden />
                      {product.category}
                    </span>
                  </td>
                  <td className="w-[24%] text-center">
                    <DeskPrice amount={product.price} />
                  </td>
                  <td className="w-[20%]">
                    <StockEditor product={product} onConfirm={(next) => confirmStock(product, next)} />
                  </td>
                  <td className="w-28">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        type="button"
                        variant="glass"
                        size="icon"
                        className="size-9"
                        aria-label={`Editar ${product.name}`}
                        onClick={() => setEditor(product)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="glass"
                        size="icon"
                        className="size-9"
                        data-tone="danger"
                        aria-label={`Eliminar ${product.name}`}
                        onClick={() => setPendingDelete(product)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </TablePane>
    </ModuleStage>
    </div>
      <AdminDialog
        open={editor !== null}
        title={editor === 'new' || editor === null ? 'Nueva pieza' : `Editar ${editor.name}`}
        onClose={() => setEditor(null)}
      >
        <ProductFormFields
          key={editor === 'new' || editor === null ? 'new' : editor.id}
          product={editor === 'new' || editor === null ? undefined : editor}
          onCancel={() => setEditor(null)}
          onSave={save}
        />
      </AdminDialog>
      <AdminDialog
        open={pendingDelete !== null}
        title={pendingDelete ? `¿Eliminar ${pendingDelete.name}?` : 'Eliminar'}
        onClose={() => setPendingDelete(null)}
      >
        <p className="text-[1.0625rem] leading-relaxed text-muted">
          Sale del catálogo y de la bolsa. Los cupones que apuntaban a{' '}
          <span className="text-ink">{pendingDelete?.id}</span> quedan desasociados; el código del cupón se conserva.
        </p>
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={confirmDelete}>
            <Trash2 className="size-4" />
            Eliminar pieza
          </Button>
        </div>
      </AdminDialog>
    </>
  )
}
