import { CheckoutPanel } from '@/modules/checkout/CheckoutPanel'
import { CheckoutConfirm } from '@/modules/checkout/CheckoutConfirm'
import { CouponForm } from '@/modules/checkout/CouponForm'
import { AppliedPills } from '@/modules/checkout/AppliedPills'
import { useCheckoutStore } from '@/modules/checkout/store'
import { CartLineRow } from './CartLine'
import { useCartLines } from './store'

export function CartDesk() {
  return (
    <div id="sala-bag" tabIndex={-1} className="flex h-full min-h-0 flex-1 flex-col outline-none">
      <Invoice contained />
    </div>
  )
}

export function CartRail() {
  return <CartDesk />
}

export function CartSummary() {
  return <Invoice />
}

function Invoice({ contained = false }: { contained?: boolean }) {
  const lines = useCartLines()
  const orderId = useCheckoutStore((s) => s.orderId)

  const list = (
    <ul className="m-0 shrink-0 list-none p-0">
      {lines.map((line) => (
        <li key={line.product.id} className="border-b border-line/70 last:border-b-0">
          <CartLineRow line={line} />
        </li>
      ))}
    </ul>
  )

  return (
    <div className={contained ? 'flex h-full min-h-0 flex-1 flex-col overflow-hidden' : 'flex flex-col'}>
      <CouponForm compact />
      <div className="mt-2 empty:hidden">
        <AppliedPills />
      </div>
      {lines.length === 0 ? (
        <div className="mt-5 flex flex-col gap-4">
          <p className="type-caption">Tu bolsa está vacía.</p>
          {orderId ? <CheckoutConfirm /> : null}
        </div>
      ) : contained ? (
        <>
          <div className="shop-pane mt-4 min-h-0 flex-1 !px-0 !py-0 !pr-5">{list}</div>
          <div className="mt-3 shrink-0 border-t border-line/80 pt-3">
            <CheckoutPanel coupon={false} />
          </div>
        </>
      ) : (
        <div className="mt-4">
          {list}
          <div className="mt-3 border-t border-line/80 pt-3">
            <CheckoutPanel coupon={false} />
          </div>
        </div>
      )}
    </div>
  )
}
