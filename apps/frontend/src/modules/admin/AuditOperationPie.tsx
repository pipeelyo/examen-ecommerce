import type { AuditEvent } from '@/mocks/auditBook'
import { colorForInsight } from './AdminInsight'

const OPS = [
  { key: 'INSERT', label: 'Altas', caption: 'INSERT' },
  { key: 'UPDATE', label: 'Cambios', caption: 'UPDATE' },
  { key: 'DELETE', label: 'Bajas', caption: 'DELETE' },
] as const

function polar(cx: number, cy: number, radius: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

function slicePath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  start: number,
  end: number,
): string {
  const sweep = end - start
  if (sweep < 0.04) return ''
  if (sweep >= 359.96) {
    const top = polar(cx, cy, outer, 0)
    const bottom = polar(cx, cy, outer, 180)
    const innerTop = polar(cx, cy, inner, 0)
    const innerBottom = polar(cx, cy, inner, 180)
    return [
      `M ${top.x} ${top.y}`,
      `A ${outer} ${outer} 0 1 1 ${bottom.x} ${bottom.y}`,
      `A ${outer} ${outer} 0 1 1 ${top.x} ${top.y}`,
      `M ${innerTop.x} ${innerTop.y}`,
      `A ${inner} ${inner} 0 1 0 ${innerBottom.x} ${innerBottom.y}`,
      `A ${inner} ${inner} 0 1 0 ${innerTop.x} ${innerTop.y}`,
    ].join(' ')
  }
  const large = sweep > 180 ? 1 : 0
  const a = polar(cx, cy, outer, start)
  const b = polar(cx, cy, outer, end)
  const c = polar(cx, cy, inner, end)
  const d = polar(cx, cy, inner, start)
  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`
}

function shareLabel(share: number): string {
  return `${share.toFixed(1)}%`
}

export function AuditOperationPie({ events }: { events: AuditEvent[] }) {
  const total = events.length
  const slices = OPS.map((op, index) => {
    const count = events.filter((event) => event.operation === op.key).length
    return {
      ...op,
      count,
      share: total === 0 ? 0 : (count / total) * 100,
      color: colorForInsight(op.label, index),
    }
  })
  const lead = slices.reduce((best, slice) => (slice.share > best.share ? slice : best), slices[0]!)
  let cursor = 0
  const drawn = slices
    .filter((slice) => slice.count > 0)
    .map((slice) => {
      const start = cursor
      const sweep = (slice.share / 100) * 360
      cursor += sweep
      return { ...slice, start, end: start + sweep }
    })

  const summary = slices.map((slice) => `${slice.label} ${shareLabel(slice.share)}`).join(', ')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="type-kicker shrink-0">Por operación</p>
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-5">
        <div className="grid min-h-[16.5rem] flex-1 place-items-center">
          <div className="@container relative aspect-square h-[min(100%,22rem)] w-[min(100%,22rem)]">
            <svg
              viewBox="0 0 100 100"
              className="size-full motion-rise"
              role="img"
              aria-label={`Torta de operaciones: ${summary}`}
            >
              <circle cx="50" cy="50" r="48" fill="color-mix(in srgb, var(--color-card) 78%, transparent)" />
              {drawn.map((slice) => (
                <path
                  key={slice.key}
                  d={slicePath(50, 50, 48, 29, slice.start, slice.end)}
                  fill={slice.color}
                  fillRule="evenodd"
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-[29%] flex flex-col items-center justify-center text-center">
              <p className="font-display text-[clamp(1.7rem,28cqi,2.65rem)] leading-none tracking-[-0.05em] tabular-nums">
                {lead ? shareLabel(lead.share) : '0.0%'}
              </p>
              <p className="type-kicker mt-2">{lead?.label ?? '—'}</p>
            </div>
          </div>
        </div>
        <ul className="grid shrink-0 grid-cols-3 gap-x-3 gap-y-2">
          {slices.map((slice) => (
            <li key={slice.key} className="min-w-0">
              <p className="flex items-center gap-1.5">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden />
                <span className="type-kicker truncate">{slice.label}</span>
              </p>
              <p className="mt-1.5 font-display text-[1.55rem] leading-none tracking-[-0.04em] tabular-nums">
                {shareLabel(slice.share)}
              </p>
              <p className="type-caption mt-1.5 tabular-nums">
                {slice.count} · {slice.caption}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
