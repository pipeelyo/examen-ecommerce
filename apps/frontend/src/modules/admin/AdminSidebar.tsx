import { cn } from '@/shared/lib/cn'
import { ADMIN_SECTIONS, SECTION_ICON, type AdminSection } from './sections'

interface AdminSidebarProps {
  section: AdminSection
  collapsed: boolean
  onSection: (id: AdminSection) => void
}

export function AdminSidebar({ section, collapsed, onSection }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        'glass flex h-svh shrink-0 flex-col border-r border-line text-ink transition-[width] duration-200 ease-out',
        collapsed ? 'w-[4.25rem]' : 'w-72',
      )}
    >
      <div className={cn('flex items-center gap-3 border-b border-line px-4 py-5', collapsed && 'justify-center px-2')}>
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ink text-[0.6875rem] font-medium tracking-[0.12em] text-card"
        >
          ATN
        </span>
        {collapsed ? null : (
          <div className="min-w-0">
            <p className="font-display truncate text-[1.125rem] leading-none">KataE1 - Ecommerce</p>
            <p className="type-kicker mt-1.5 truncate">Taller · ADMIN</p>
          </div>
        )}
      </div>
      <nav aria-label="Módulos de gestión" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-4">
        {collapsed ? null : (
          <p className="type-kicker px-3 pb-3 pt-1">Gestión</p>
        )}
        <ul className="flex flex-col gap-3">
          {ADMIN_SECTIONS.map((item) => {
            const Icon = SECTION_ICON[item.id]
            const active = item.id === section
            return (
              <li key={item.id}>
                <button
                  type="button"
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onSection(item.id)}
                  className={cn(
                    'flex min-h-12 w-full items-center gap-3 rounded-full px-3.5 text-left text-[1.125rem] font-medium outline-none transition-[color,background-color] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-copper',
                    collapsed && 'size-12 min-h-0 justify-center px-0',
                    active ? 'bg-ink text-card' : 'text-muted hover:bg-card hover:text-ink',
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
