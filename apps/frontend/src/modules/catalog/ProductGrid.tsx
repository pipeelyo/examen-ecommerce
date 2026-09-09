import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, ShoppingBag, type LucideIcon } from 'lucide-react'
import { getProducts } from '@/shared/api/commerce'
import type { ProductDto } from '@/shared/types'
import { cn } from '@/shared/lib/cn'
import { selectItemCount, selectSubtotal, useCartStore } from '@/modules/cart/store'
import { useCheckoutStore } from '@/modules/checkout/store'
import { BagTotal } from '@/modules/cart/BagTotal'
import { AppliedPills } from '@/modules/checkout/AppliedPills'
import { CATEGORY_ICON } from './categories'
import { ProductCard } from './ProductCard'

export function ProductGrid({
  bagOpen = false,
  onToggleBag,
}: {
  bagOpen?: boolean
  onToggleBag?: () => void
}) {
  const [products, setProducts] = useState<ProductDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('todos')
  const count = useCartStore(selectItemCount)
  const subtotal = useCartStore(selectSubtotal)
  const total = useCheckoutStore((s) => s.preview?.finalTotal ?? subtotal)
  const orderId = useCheckoutStore((s) => s.orderId)

  useEffect(() => {
    let cancelled = false
    void getProducts()
      .then((data) => {
        if (!cancelled) setProducts(data)
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar el catálogo')
      })
    return () => {
      cancelled = true
    }
    // orderId cambia a un id real justo cuando se confirma un pedido — el
    // checkout ya reservo/descarto stock en el backend, hay que recargar el
    // catalogo para que "disponibles" refleje el stock real (antes se
    // quedaba con la foto del primer fetch para siempre).
  }, [orderId])

  const categories = useMemo(() => {
    const unique = new Set(products.map((product) => product.category))
    return [...unique]
  }, [products])

  const visible = filter === 'todos' ? products : products.filter((product) => product.category === filter)

  const toolbar = (
    <div className="flex shrink-0 items-end justify-between gap-4 px-5 pt-5">
      <div className="min-w-0 flex-1">
        <h1
          id="catalog-title"
          className="font-display text-[2.15rem] leading-[0.92] tracking-[-0.045em] text-ink sm:text-[2.75rem]"
        >
          Piezas en sala
        </h1>
        <div className="mt-4 flex min-w-0 flex-wrap gap-2 max-md:gap-2.5" role="group" aria-label="Filtrar categoría">
        <FilterChip
          label="Todos"
          icon={LayoutGrid}
          active={filter === 'todos'}
          onClick={() => setFilter('todos')}
        />
        {categories.map((category) => {
          const Icon = CATEGORY_ICON[category] ?? LayoutGrid
          return (
            <FilterChip
              key={category}
              label={category}
              icon={Icon}
              active={filter === category}
              onClick={() => setFilter(category)}
            />
          )
        })}
        </div>
      </div>
      {bagOpen ? null : (
        // Solo desktop (md: = 768px, mismo breakpoint que useDesktopNav): en
        // mobile este bloque quedaba SIEMPRE visible al lado del titulo
        // (bagOpen nunca es true ahi, BuyerShell abre el CartSheet en su
        // lugar), comprimiendo "Piezas en sala" + los chips de categoria a
        // ~108px de ancho y forzando su wrap a varias lineas — eso empujaba
        // .shop-pane (el listado real) a una altura de ~18px, invisible.
        // MobileBar ya muestra el mismo total/boton en un dock inferior.
        <div className="hidden shrink-0 flex-col items-end gap-2.5 md:flex">
          <button
            type="button"
            aria-pressed={false}
            aria-expanded={false}
            aria-label={`Abrir bolsa, ${count} artículos`}
            onClick={onToggleBag}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 text-[0.875rem] font-medium text-card transition-[color,background-color] duration-200 ease-out hover:bg-ink/90"
          >
            <ShoppingBag className="size-3.5" aria-hidden />
            Carrito de compras
          </button>
          <BagTotal amount={total} align="end" size="lg" />
          <AppliedPills align="end" />
        </div>
      )}
    </div>
  )

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {toolbar}
        <p role="alert" className="px-6 py-5 text-danger">
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {toolbar}
      <div className="flex shrink-0 items-baseline justify-between gap-3 px-5 pb-3 pt-1">
        <p className="text-[0.875rem] text-muted">
          {visible.length} {visible.length === 1 ? 'resultado' : 'resultados'}
        </p>
      </div>
      <div className="shop-pane min-h-0 flex-1 !px-0 !pt-0">
        <div className="flex shrink-0 flex-col">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}

function FilterChip({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[0.875rem] transition-[color,background-color,border-color,transform] duration-200 ease-out active:scale-95 max-md:min-h-11',
        active ? 'bg-ink text-card' : 'border border-line bg-card text-muted hover:text-ink',
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </button>
  )
}
