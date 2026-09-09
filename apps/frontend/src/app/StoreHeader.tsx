import { SessionMark } from '@/modules/auth/SessionMark'
import { useDesktopNav } from '@/shared/hooks/useDesktopNav'

export function StoreHeader() {
  const desktop = useDesktopNav()

  return (
    <header className={desktop ? 'flex min-h-20 shrink-0 items-center gap-4 px-6 py-2' : 'sticky top-0 z-30 bg-canvas'}>
      <div className={desktop ? 'flex min-w-0 flex-1 items-center gap-4' : 'flex items-center justify-between gap-3 px-5 py-4'}>
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ink text-[0.6875rem] font-medium tracking-[0.12em] text-card"
          >
            ATN
          </span>
          <div className="min-w-0">
            <a href="#catalog-title" className="font-display block truncate text-[1.2rem] leading-none">
              KataE1 - Ecommerce
            </a>
            <p className="type-kicker mt-1.5">Sala · Cliente</p>
          </div>
        </div>
        <div className="ml-auto shrink-0">
          <SessionMark />
        </div>
      </div>
    </header>
  )
}
