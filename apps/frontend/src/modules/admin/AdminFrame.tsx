import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export type { InsightFigure, InsightMixPart } from './AdminInsight'
export {
  colorForInsight,
  InsightFigures,
  InsightHero,
  InsightMix,
  InsightPanel,
  InsightRead,
  ModuleInsight,
} from './AdminInsight'

export function ModuleStage({
  icon: Icon,
  titleId,
  title,
  action,
  aside,
  asideLabel = 'Resumen del módulo',
  contentLabel = 'Gestión',
  asideClassName,
  children,
}: {
  icon: LucideIcon
  titleId: string
  title: string
  action?: ReactNode
  aside: ReactNode
  asideLabel?: string
  contentLabel?: string
  asideClassName?: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={titleId}
      className="motion-stage glass flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem]"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/35 px-6 py-4 max-md:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className="size-4 shrink-0 text-copper" aria-hidden />
          <h1
            id={titleId}
            className="text-[1.125rem] font-medium leading-tight tracking-tight max-md:whitespace-normal md:truncate md:leading-none"
          >
            {title}
          </h1>
        </div>
        {action}
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] overflow-hidden max-md:grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.618fr)]">
        <aside
          className={cn(
            'flex min-h-0 flex-col overflow-y-auto border-white/30 p-6 max-md:p-4 lg:border-r',
            asideClassName,
          )}
          aria-label={asideLabel}
        >
          {aside}
        </aside>
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden" role="region" aria-label={contentLabel}>
          {children}
        </div>
      </div>
    </section>
  )
}

export function TablePane({ children }: { children: ReactNode }) {
  return <div className="table-pane min-h-0 flex-1">{children}</div>
}
