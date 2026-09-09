import { useEffect, useRef } from 'react'
import { Ban, Check, Plus, ShoppingBag, Truck } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Price } from '@/shared/ui/Price'
import type { ProductDto } from '@/shared/types'
import { useCartPulse } from '@/modules/cart/useCartPulse'
import { useCartStore } from '@/modules/cart/store'
import { TECH_CATEGORY } from '@/mocks/seed'
import { cn } from '@/shared/lib/cn'
import { LISTING_COPY } from './listing'
import { ProductThumb } from './ProductThumb'

function AddToBagButton({
  product,
  outOfStock,
  atMax,
}: {
  product: ProductDto
  outOfStock: boolean
  atMax: boolean
}) {
  const add = useCartStore((s) => s.add)
  const label = outOfStock ? 'Agotado' : atMax ? 'En la bolsa' : 'Comprar'

  return (
    <Button
      type="button"
      variant={outOfStock ? 'ghost' : atMax ? 'glass' : 'copper'}
      size="sm"
      className="w-fit gap-1.5"
      data-tone={atMax ? 'sage' : undefined}
      disabled={outOfStock || atMax}
      onClick={() => add(product)}
      aria-label={outOfStock ? `${product.name} sin stock` : `Agregar ${product.name}`}
    >
      {outOfStock ? (
        <Ban />
      ) : atMax ? (
        <Check />
      ) : (
        <span className="inline-flex items-center">
          <Plus className="mt-0.5 !size-2.5 -mr-px self-start" strokeWidth={2.75} aria-hidden />
          <ShoppingBag aria-hidden />
        </span>
      )}
      {label}
    </Button>
  )
}

function PriceAndBuy({
  product,
  outOfStock,
  atMax,
  className,
}: {
  product: ProductDto
  outOfStock: boolean
  atMax: boolean
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <Price display amount={product.price} className="text-[1.75rem] sm:text-[2rem]" />
      <AddToBagButton product={product} outOfStock={outOfStock} atMax={atMax} />
      {outOfStock ? null : <p className="type-caption">{product.stock} disponibles</p>}
    </div>
  )
}

export function ProductCard({ product }: { product: ProductDto }) {
  const line = useCartStore((s) => s.lines[product.id])
  const outOfStock = product.stock <= 0
  const atMax = (line?.quantity ?? 0) >= product.stock
  const techDeal = product.category === TECH_CATEGORY
  const copy = LISTING_COPY[product.id]
  const bump = useCartPulse(product.id)
  const articleRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (bump) {
      articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [bump])

  return (
    <article
      ref={articleRef}
      data-bump={bump || undefined}
      className={cn(
        'product-row flex gap-3.5 border-b border-line/70 bg-card/55 px-4 py-4 last:border-b-0 sm:gap-5 sm:px-5 sm:py-5',
        outOfStock ? 'opacity-70' : 'hover:bg-card',
      )}
    >
      <ProductThumb
        product={product}
        className={cn('size-[6.75rem] sm:size-[9.25rem]', outOfStock && 'grayscale')}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="text-[0.975rem] font-medium leading-snug tracking-[-0.02em] text-ink sm:text-[1.125rem]">
          {product.name}
        </h2>
        {copy ? <p className="type-caption mt-1 line-clamp-2">{copy}</p> : null}
        <p className="type-caption mt-1">{product.category}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {techDeal ? (
            <span className="rounded-full bg-sage-soft px-2 py-0.5 text-[0.6875rem] font-medium tracking-[0.04em] text-sage">
              10% OFF
            </span>
          ) : null}
          {outOfStock ? (
            <span className="text-[0.8125rem] text-danger">Sin stock</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[0.8125rem] text-sage">
              <Truck className="size-3.5" aria-hidden />
              Retiro en sala
            </span>
          )}
        </div>
        <PriceAndBuy
          product={product}
          outOfStock={outOfStock}
          atMax={atMax}
          className="mt-auto items-start pt-4 sm:hidden"
        />
      </div>
      <PriceAndBuy
        product={product}
        outOfStock={outOfStock}
        atMax={atMax}
        className="hidden shrink-0 items-end justify-end text-right sm:flex"
      />
    </article>
  )
}
