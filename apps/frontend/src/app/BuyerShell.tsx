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
    // h-svh + overflow-hidden en AMBAS ramas (no solo desktop): .shop-pane
    // (y toda la cadena flex-1/min-h-0 hasta aqui) esta hecha para scroll
    // INTERNO con overflow-y-auto, no para que la pagina crezca con el
    // contenido. Sin una altura acotada arriba, un contenedor flex-basis:0
    // con min-h-0 se permite encoger a ~0 en vez de expandirse — eso dejaba
    // el catalogo invisible en mobile. MobileBar es position:fixed, asi que
    // no le afecta que main pase a tener overflow-hidden + scroll interno.
    <div className="flex h-svh flex-col overflow-hidden">
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
