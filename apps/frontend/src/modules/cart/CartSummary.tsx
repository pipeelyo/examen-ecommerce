import { CheckoutPanel } from '@/modules/checkout/CheckoutPanel'
import { CheckoutConfirm } from '@/modules/checkout/CheckoutConfirm'
import { useCheckoutStore } from '@/modules/checkout/store'
import { CartLineRow } from './CartLine'
import { useCartLines } from './store'

export function CartSummary() {
  const lines = useCartLines()
  const orderId = useCheckoutStore((s) => s.orderId)

  if (lines.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <p className="type-caption">Tu bolsa está vacía. Elige una pieza del catálogo.</p>
        {orderId ? <CheckoutConfirm /> : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <ul className="m-0 list-none p-0">
        {lines.map((line) => (
          <li key={line.product.id} className="border-b border-line/70 last:border-b-0">
            <CartLineRow line={line} />
          </li>
        ))}
      </ul>
      <CheckoutPanel />
    </div>
  )
}
