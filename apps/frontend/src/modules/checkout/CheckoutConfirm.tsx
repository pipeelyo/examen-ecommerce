import { confirmCheckout } from '@/shared/api/commerce'
import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { useAuthStore } from '@/modules/auth/store'
import { selectCheckoutItems, selectItemCount, useCartStore } from '@/modules/cart/store'
import { useCheckoutStore } from './store'

export function CheckoutConfirm() {
  const itemCount = useCartStore(selectItemCount)
  const clear = useCartStore((s) => s.clear)
  const couponCode = useCheckoutStore((s) => s.couponCode)
  const customerEmail = useAuthStore((s) => s.email)
  const confirming = useCheckoutStore((s) => s.confirming)
  const orderId = useCheckoutStore((s) => s.orderId)
  const confirmError = useCheckoutStore((s) => s.confirmError)
  const setConfirming = useCheckoutStore((s) => s.setConfirming)
  const setOrderId = useCheckoutStore((s) => s.setOrderId)
  const setConfirmError = useCheckoutStore((s) => s.setConfirmError)

  async function onConfirm() {
    setConfirming(true)
    setConfirmError(null)
    try {
      const items = selectCheckoutItems(useCartStore.getState())
      const order = await confirmCheckout({ items, couponCode, customerEmail: customerEmail || undefined })
      setOrderId(order.orderId)
      clear()
    } catch (err) {
      if (err instanceof ApiError) {
        setConfirmError(err.body.code)
      } else {
        setConfirmError('CHECKOUT_FAILED')
      }
    } finally {
      setConfirming(false)
    }
  }

  if (orderId) {
    return (
      <p role="status" className="rounded-2xl bg-sage-soft px-5 py-4 text-[0.9375rem] text-sage">
        Pedido confirmado {orderId}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Button type="button" variant="ink" disabled={itemCount === 0 || confirming} onClick={() => void onConfirm()}>
        {confirming ? 'Confirmando…' : 'Confirmar pedido'}
      </Button>
      {confirmError ? (
        <p role="alert" className="text-[0.9375rem] text-danger">
          {confirmError}
        </p>
      ) : null}
    </div>
  )
}
