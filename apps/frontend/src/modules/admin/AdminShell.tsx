import { useEffect, useState } from 'react'
import { useDesktopNav } from '@/shared/hooks/useDesktopNav'
import { cn } from '@/shared/lib/cn'
import { AdminDesktopHeader } from './AdminDesktopHeader'
import { AdminMobileHeader } from './AdminMobileHeader'
import { AdminNavBar } from './AdminNavBar'
import { AdminSidebar } from './AdminSidebar'
import { AuditLedger } from './AuditLedger'
import { CouponDesk } from './CouponDesk'
import { ProductDesk } from './ProductDesk'
import { hashForSection, metaForSection, SECTION_ICON, sectionFromHash, type AdminSection } from './sections'

export function AdminShell() {
  const desktop = useDesktopNav()
  const [section, setSection] = useState<AdminSection>(sectionFromHash)
  const [collapsed, setCollapsed] = useState(false)
  const current = metaForSection(section)

  useEffect(() => {
    const sync = () => setSection(sectionFromHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    const next = `#${hashForSection(section)}`
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`)
    }
  }, [section])

  return (
    // h-svh + overflow-hidden tambien en mobile: ModuleStage (aside +
    // TablePane) depende de una altura acotada arriba para su scroll
    // interno; sin ella, flex-basis:0 + min-h-0 colapsa a ~0 en vez de
    // expandirse (mismo bug que en BuyerShell). AdminNavBar es
    // position:fixed, no le afecta que main pase a overflow-hidden.
    <div className={cn('flex h-svh overflow-hidden', desktop ? '' : 'flex-col')}>
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-40 focus:rounded-full focus:bg-card focus:px-4 focus:py-2"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('admin-main')?.focus()
        }}
      >
        Saltar al contenido
      </a>
      {desktop ? (
        <AdminSidebar section={section} collapsed={collapsed} onSection={setSection} />
      ) : (
        <AdminMobileHeader />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {desktop ? (
          <AdminDesktopHeader
            title={current.label}
            icon={SECTION_ICON[section]}
            collapsed={collapsed}
            onToggle={() => setCollapsed((value) => !value)}
          />
        ) : null}
        <main
          id="admin-main"
          tabIndex={-1}
          className={cn(
            'flex min-h-0 flex-1 flex-col outline-none',
            desktop ? 'overflow-hidden p-5' : 'overflow-hidden px-4 pb-28 pt-4',
          )}
        >
          {section === 'products' ? <ProductDesk /> : null}
          {section === 'coupons' ? <CouponDesk /> : null}
          {section === 'audit' ? <AuditLedger /> : null}
        </main>
      </div>
      {desktop ? null : <AdminNavBar section={section} onSection={setSection} />}
    </div>
  )
}
