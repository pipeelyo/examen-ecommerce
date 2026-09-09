import type { LucideIcon } from 'lucide-react'
import { PanelLeft } from 'lucide-react'
import { SessionMark } from '@/modules/auth/SessionMark'
import { Button } from '@/shared/ui/Button'

interface AdminDesktopHeaderProps {
  title: string
  icon: LucideIcon
  collapsed: boolean
  onToggle: () => void
}

export function AdminDesktopHeader({ title, icon: Icon, collapsed, onToggle }: AdminDesktopHeaderProps) {
  return (
    <header className="glass flex h-20 shrink-0 items-center gap-4 px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 min-h-0"
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        aria-pressed={collapsed}
        onClick={onToggle}
      >
        <PanelLeft className="size-4" />
      </Button>
      <span className="h-4 w-px bg-line" aria-hidden />
      <Icon className="size-4 text-muted" aria-hidden />
      <p key={title} className="motion-rise text-[0.975rem] font-medium">
        {title}
      </p>
      <div className="ml-auto">
        <SessionMark />
      </div>
    </header>
  )
}
