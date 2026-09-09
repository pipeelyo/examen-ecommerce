import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface InsightFigure {
  label: string
  value: string | number
  warn?: boolean
}

export interface InsightMixPart {
  label: string
  weight: number
  hero: string
  caption?: string
  color?: string
}

const INSIGHT_COLOR: Record<string, string> = {
  Tecnología: '#e24b1c',
  Libros: '#1b8a4a',
  Muebles: '#d49212',
  Hogar: '#1788a0',
  Ropa: '#d42a72',
  Vigentes: '#1b8a4a',
  'En pausa': '#d49212',
  Vencidos: '#d42a72',
  Altas: '#1b8a4a',
  Cambios: '#1788a0',
  Bajas: '#e24b1c',
  Categoría: '#e24b1c',
  Volumen: '#d49212',
  Cupón: '#1b8a4a',
}

const INSIGHT_FALLBACK = ['#e24b1c', '#1b8a4a', '#d49212', '#1788a0', '#d42a72', '#4f46c8']

export function colorForInsight(label: string, index: number): string {
  return INSIGHT_COLOR[label] ?? INSIGHT_FALLBACK[index % INSIGHT_FALLBACK.length] ?? '#1c1410'
}

export function InsightPanel({ children }: { children: ReactNode }) {
  return <div className="motion-stagger flex h-full min-h-0 flex-1 flex-col gap-3">{children}</div>
}

export function InsightHero({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <div className="shrink-0">
      <p className="type-kicker">{kicker}</p>
      <p className="mt-1 font-display text-[clamp(2.85rem,1.5rem+3.4vw,4.35rem)] leading-[0.88] tracking-[-0.05em] tabular-nums">
        {children}
      </p>
    </div>
  )
}

export function InsightRead({
  children,
  tone,
}: {
  children: ReactNode
  tone?: 'danger' | 'sage'
}) {
  return (
    <p
      className={cn(
        'shrink-0 text-[0.9375rem] leading-snug',
        tone === 'danger' ? 'text-danger' : tone === 'sage' ? 'text-sage' : 'text-ink',
      )}
    >
      {children}
    </p>
  )
}

export function InsightFigures({ figures }: { figures: InsightFigure[] }) {
  if (figures.length === 0) return null
  return (
    <dl className="grid shrink-0 grid-cols-3 gap-x-3 gap-y-2.5">
      {figures.map((figure) => (
        <div key={figure.label} className="min-w-0">
          <dt className="type-kicker">{figure.label}</dt>
          <dd
            className={cn(
              'mt-0.5 font-display text-[1.25rem] leading-none tracking-[-0.03em] tabular-nums',
              figure.warn && 'text-danger',
            )}
          >
            {figure.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function InsightMix({ title, parts }: { title: string; parts: InsightMixPart[] }) {
  if (parts.length === 0) return null
  const painted = parts.map((part, index) => ({
    ...part,
    color: part.color ?? colorForInsight(part.label, index),
  }))
  const total = painted.reduce((sum, part) => sum + part.weight, 0)

  return (
    <div className="flex min-h-56 flex-1 flex-col">
      <p className="type-kicker shrink-0">{title}</p>
      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        {total > 0 ? (
          <div
            className="motion-grow-y flex w-2.5 shrink-0 flex-col overflow-hidden rounded-full bg-line/55"
            aria-hidden
          >
            {painted
              .filter((part) => part.weight > 0)
              .map((part) => (
                <span
                  key={part.label}
                  title={`${part.label}: ${((part.weight / total) * 100).toFixed(1)}%`}
                  style={{
                    flex: `${part.weight} 0 0`,
                    minHeight: 0,
                    backgroundColor: part.color,
                  }}
                />
              ))}
          </div>
        ) : null}
        <ul className="motion-stagger flex min-h-0 min-w-0 flex-1 flex-col justify-between py-0.5">
          {painted.map((part, index) => {
            const share = total > 0 ? (part.weight / total) * 100 : 0
            const alignEnd = index % 2 === 1
            return (
              <li
                key={part.label}
                className={cn('flex items-start gap-2', alignEnd && 'flex-row-reverse text-right')}
              >
                <span
                  aria-hidden
                  className="mt-2 size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: part.color }}
                />
                <div className="min-w-0">
                  <p className="type-kicker">{part.label}</p>
                  <p className="mt-1 font-display text-[1.625rem] leading-none tracking-[-0.04em] tabular-nums">
                    {part.hero}
                  </p>
                  <p className="mt-1 text-[0.8125rem] leading-tight tabular-nums text-muted">
                    {share.toFixed(1)}%{part.caption ? ` · ${part.caption}` : ''}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export function ModuleInsight({
  hero,
  unit,
  narrative,
  tone,
  figures,
  mix,
  children,
}: {
  hero: string
  unit: string
  narrative?: ReactNode
  tone?: 'danger' | 'sage'
  figures: InsightFigure[]
  mix?: { title: string; parts: InsightMixPart[] }
  children?: ReactNode
}) {
  return (
    <InsightPanel>
      <InsightHero kicker={unit}>{hero}</InsightHero>
      {narrative ? <InsightRead tone={tone}>{narrative}</InsightRead> : null}
      <InsightFigures figures={figures} />
      {mix ? <InsightMix title={mix.title} parts={mix.parts} /> : null}
      {children}
    </InsightPanel>
  )
}
