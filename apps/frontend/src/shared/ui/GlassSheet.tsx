import type { ReactNode } from 'react'
import { ShoppingBag, X } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

interface GlassSheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function GlassSheet({ open, title, onClose, children }: GlassSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Cerrar bolsa"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-sheet-title"
        className="glass absolute inset-x-0 bottom-0 flex max-h-[86svh] flex-col overflow-hidden rounded-t-[1.75rem]"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-line" />
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/35 px-6 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <ShoppingBag className="size-4 shrink-0 text-copper" aria-hidden />
            <h2 id="cart-sheet-title" className="text-[1.125rem] font-medium leading-none tracking-tight">
              {title}
            </h2>
          </div>
          <Button type="button" variant="ghost" size="icon" className="size-9 min-h-0" onClick={onClose} aria-label="Cerrar">
            <X className="size-4" />
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-4">{children}</div>
      </div>
    </div>
  )
}
