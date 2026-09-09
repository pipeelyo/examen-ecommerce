import { Trash2 } from 'lucide-react'
import { Price } from '@/shared/ui/Price'
import { Button } from '@/shared/ui/Button'
import { moneyOf } from '@/shared/lib/money'
import { ProductThumb } from '@/modules/catalog/ProductThumb'
import { QtyStepper } from './QtyStepper'
import { useCartPulse } from './useCartPulse'
import { useCartStore, type CartLine } from './store'

export function CartLineRow({ line }: { line: CartLine }) {
  const increment = useCartStore((s) => s.increment)
  const decrement = useCartStore((s) => s.decrement)
  const remove = useCartStore((s) => s.remove)
  const bump = useCartPulse(line.product.id)
  const labelId = `line-${line.product.id}`

  return (
    <div className="cart-line-enter">
      <div className="cart-line-clip">
        <div
          data-bump={bump || undefined}
          className="cart-line-body flex items-start gap-3 rounded-[0.85rem] px-1 py-3"
        >
          <ProductThumb product={line.product} className="size-20" />
          <div className="min-w-0 flex-1">
            <p id={labelId} className="line-clamp-2 text-[0.9375rem] font-medium leading-snug text-ink">
              {line.product.name}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <QtyStepper
                compact
                value={line.quantity}
                max={line.product.stock}
                labelledBy={labelId}
                onIncrement={() => increment(line.product.id)}
                onDecrement={() => decrement(line.product.id)}
              />
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Price
                  amount={moneyOf(line.product.price, line.quantity)}
                  className="cart-line-qty font-display text-[1.0625rem] tabular-nums"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 min-h-8 text-muted hover:text-danger"
                  aria-label={`Quitar ${line.product.name}`}
                  onClick={() => remove(line.product.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
