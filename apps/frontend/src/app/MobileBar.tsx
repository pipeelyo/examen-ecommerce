import { ShoppingBag } from 'lucide-react'
import { CommerceBar } from '@/shared/ui/CommerceBar'
import { Price } from '@/shared/ui/Price'
import { selectItemCount, selectSubtotal, useCartStore } from '@/modules/cart/store'
import { useCheckoutStore } from '@/modules/checkout/store'

export function MobileBar() {
  const count = useCartStore(selectItemCount)
  const subtotal = useCartStore(selectSubtotal)
  const openSheet = useCartStore((s) => s.openSheet)
  const total = useCheckoutStore((s) => s.preview?.finalTotal ?? subtotal)

  return (
    <CommerceBar
      disabled={count === 0}
      actionLabel="Ver bolsa"
      onAction={openSheet}
      left={
        <div className="flex items-center gap-3">
          <ShoppingBag className="size-4 text-copper" aria-hidden />
          <div>
            <p className="type-kicker">{count} en bolsa</p>
            <Price amount={total} className="font-display text-[1.35rem] leading-none tracking-[-0.03em]" />
          </div>
        </div>
      }
    />
  )
}
