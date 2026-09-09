import { ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { CartDesk } from './CartRail'

export function CartDock({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <aside
      aria-label="Carrito de compras"
      aria-hidden={!open}
      data-open={open}
      className="bag-dock hidden h-full min-h-0 shrink-0 flex-col overflow-hidden lg:flex"
    >
      <div className="flex h-full min-h-0 w-[var(--dock-open)] flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/35 px-4 py-3">
          <h2 className="min-w-0 truncate font-display text-[1.35rem] leading-none tracking-[-0.03em]">
            Carrito de compras
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 min-h-0"
            tabIndex={open ? 0 : -1}
            aria-label="Colapsar bolsa"
            aria-expanded={open}
            onClick={() => onOpenChange(false)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5">
          <CartDesk />
        </div>
      </div>
    </aside>
  )
}
