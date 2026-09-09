import { GlassSheet } from '@/shared/ui/GlassSheet'
import { CartSummary } from './CartSummary'
import { useCartStore } from './store'

export function CartSheet() {
  const open = useCartStore((s) => s.sheetOpen)
  const closeSheet = useCartStore((s) => s.closeSheet)

  return (
    <GlassSheet open={open} title="Carrito de compras" onClose={closeSheet}>
      <CartSummary />
    </GlassSheet>
  )
}
