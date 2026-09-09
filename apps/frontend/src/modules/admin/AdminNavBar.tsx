import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import { ADMIN_SECTIONS, SECTION_ICON, type AdminSection } from './sections'

interface AdminNavBarProps {
  section: AdminSection
  onSection: (id: AdminSection) => void
}

export function AdminNavBar({ section, onSection }: AdminNavBarProps) {
  return (
    <nav
      aria-label="Barra de navegación"
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-6xl grid-cols-3">
        {ADMIN_SECTIONS.map((item) => {
          const Icon = SECTION_ICON[item.id]
          const active = item.id === section
          return (
            <li key={item.id}>
              <Button
                type="button"
                variant="ghost"
                aria-current={active ? 'page' : undefined}
                onClick={() => onSection(item.id)}
                className={cn(
                  'h-auto min-h-16 w-full flex-col gap-1.5 rounded-none border-0 bg-transparent px-2 py-2.5 text-[0.75rem] font-medium shadow-none [&_svg]:size-5',
                  active ? 'text-copper' : 'text-muted hover:bg-card hover:text-ink',
                )}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
