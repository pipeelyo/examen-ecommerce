import { SessionMark } from '@/modules/auth/SessionMark'

export function AdminMobileHeader() {
  return (
    <header className="glass sticky top-0 z-30">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ink text-[0.6875rem] font-medium tracking-[0.12em] text-card"
          >
            ATN
          </span>
          <div className="min-w-0">
            <p className="font-display text-[1.2rem] leading-none">KataE1 - Ecommerce</p>
            <p className="type-kicker mt-1.5">Taller · ADMIN</p>
          </div>
        </div>
        <SessionMark />
      </div>
    </header>
  )
}
