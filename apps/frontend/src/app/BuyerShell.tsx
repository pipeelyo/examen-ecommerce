import { useEffect, useState } from 'react'
import { ProductGrid } from '@/modules/catalog/ProductGrid'
import { CartDock, CartSheet, useCartStore } from '@/modules/cart'
import { PreviewSync } from '@/modules/checkout/PreviewSync'
import { useDesktopNav } from '@/shared/hooks/useDesktopNav'
import { cn } from '@/shared/lib/cn'
import { StoreHeader } from './StoreHeader'
import { MobileBar } from './MobileBar'

export function BuyerShell() {
  const desktop = useDesktopNav()
  const [bagOpen, setBagOpen] = useState(false)
  const pulseAt = useCartStore((state) => state.pulse?.at ?? 0)

  useEffect(() => {
    if (!pulseAt) return
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setBagOpen(true)
      return
    }
    useCartStore.getState().openSheet()
  }, [pulseAt])

  function onToggleBag() {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      const next = !bagOpen
      setBagOpen(next)
      if (next) window.requestAnimationFrame(() => document.getElementById('sala-bag')?.focus())
      return
    }
    useCartStore.getState().openSheet()
  }

  return (
    <div className={cn('flex min-h-svh', desktop ? 'h-svh overflow-hidden flex-col' : 'flex-col')}>
      <PreviewSync />
      <a
        href="#catalog-title"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-40 focus:rounded-full focus:bg-card focus:px-4 focus:py-2"
      >
        Saltar al catálogo
      </a>
      <StoreHeader />
      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col outline-none',
          desktop ? 'overflow-hidden p-5' : 'overflow-hidden px-4 pb-28 pt-4',
        )}
      >
        <section
          aria-labelledby="catalog-title"
          className="motion-stage glass flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem]"
        >
          <div className="@container flex min-h-0 flex-1 overflow-hidden">
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden" role="region" aria-label="Catálogo">
              <ProductGrid bagOpen={bagOpen} onToggleBag={onToggleBag} />
            </div>
            <CartDock open={bagOpen} onOpenChange={setBagOpen} />
          </div>
        </section>
      </main>
      {desktop ? null : <MobileBar />}
      <CartSheet />
    </div>
  )
}
