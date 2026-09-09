import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CouponRecord } from '@/mocks/seed'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const
const TONES = ['#1b8a4a', '#c45c32', '#1788a0', '#d49212', '#d42a72'] as const

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function toYmd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function expireYmd(coupon: CouponRecord): string {
  return coupon.expiresAt.slice(0, 10)
}

function shiftMonth(year: number, month: number, delta: number) {
  const next = new Date(year, month + delta, 1)
  return { year: next.getFullYear(), month: next.getMonth() }
}

function monthLabel(year: number, month: number): string {
  const raw = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1))
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function buildGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const mondayIndex = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const start = new Date(year, month, 1 - mondayIndex)
  const length = Math.ceil((mondayIndex + daysInMonth) / 7) * 7
  return Array.from({ length }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    return {
      ymd: toYmd(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    }
  })
}

function toneFor(index: number): string {
  return TONES[index % TONES.length] ?? TONES[0]
}

function coversDay(coupon: CouponRecord, dayYmd: string, todayYmd: string): boolean {
  return dayYmd >= todayYmd && dayYmd <= expireYmd(coupon)
}

export function CouponCalendar({ coupons }: { coupons: CouponRecord[] }) {
  const today = new Date()
  const todayYmd = toYmd(today)
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [picked, setPicked] = useState(todayYmd)
  const grid = useMemo(() => buildGrid(cursor.year, cursor.month), [cursor])

  const painted = coupons.map((coupon, index) => ({
    coupon,
    tone: toneFor(index),
    end: expireYmd(coupon),
    expired: expireYmd(coupon) < todayYmd,
  }))

  const onPicked = painted.filter((entry) => coversDay(entry.coupon, picked, todayYmd) || entry.end === picked)

  return (
    <div className="flex min-h-56 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 min-h-8"
          aria-label="Mes anterior"
          onClick={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        <div className="min-w-0 flex-1 text-center">
          <p className="type-kicker">Vigencias</p>
          <p className="mt-1 font-display text-[1.15rem] leading-none tracking-[-0.03em]">
            {monthLabel(cursor.year, cursor.month)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 min-h-8"
          aria-label="Mes siguiente"
          onClick={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}
        >
          <ChevronRight className="size-3.5" />
        </Button>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col" role="region" aria-label={`Vigencias de ${monthLabel(cursor.year, cursor.month)}`}>
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((day) => (
            <span key={day} className="type-kicker py-1 text-center">
              {day}
            </span>
          ))}
        </div>
        <div className="mt-1 grid flex-1 grid-cols-7 gap-px overflow-hidden rounded-2xl bg-line/40">
          {grid.map((cell) => {
            const marks = painted.filter((entry) => coversDay(entry.coupon, cell.ymd, todayYmd))
            const endings = painted.filter((entry) => entry.end === cell.ymd)
            const isToday = cell.ymd === todayYmd
            const isPicked = cell.ymd === picked
            const dots = marks.length > 0 ? marks : endings
            return (
              <button
                key={cell.ymd}
                type="button"
                aria-current={isToday ? 'date' : undefined}
                aria-pressed={isPicked}
                aria-label={`${cell.ymd}${endings.length > 0 ? `, vence ${endings.map((entry) => entry.coupon.code).join(', ')}` : ''}`}
                onClick={() => setPicked(cell.ymd)}
                className={cn(
                  'relative flex min-h-9 flex-col items-center justify-between bg-card/80 px-0.5 py-1 text-center transition-colors',
                  !cell.inMonth && 'bg-card/35 text-muted/55',
                  isPicked && 'ring-1 ring-inset ring-copper/70',
                )}
              >
                <span
                  className={cn(
                    'font-display text-[0.95rem] leading-none tabular-nums tracking-[-0.03em]',
                    isToday && 'text-copper',
                  )}
                >
                  {cell.day}
                </span>
                <span className="flex h-1.5 items-center justify-center gap-0.5" aria-hidden>
                  {dots.slice(0, 5).map((entry) => (
                    <span
                      key={entry.coupon.code}
                      className={cn(
                        'size-1.5 rounded-full',
                        !entry.coupon.active && !entry.expired && 'opacity-45',
                      )}
                      style={{ backgroundColor: entry.tone }}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <p className="mt-3 shrink-0 text-[0.8125rem] leading-snug text-muted">
        {onPicked.length === 0
          ? `${picked}: ningún código cubre este día.`
          : `${picked}: ${onPicked.map((entry) => entry.coupon.code).join(' · ')}`}
      </p>

      <ul className="mt-3 flex shrink-0 flex-col gap-2">
        {painted.map((entry) => (
          <li key={entry.coupon.code}>
            <button
              type="button"
              className="flex w-full items-baseline justify-between gap-3 text-left"
              onClick={() => {
                const [year, month] = entry.end.split('-').map(Number)
                setCursor({ year: year ?? cursor.year, month: (month ?? 1) - 1 })
                setPicked(entry.end)
              }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.tone }} aria-hidden />
                <span className="truncate font-medium">{entry.coupon.code}</span>
              </span>
              <span className="type-caption shrink-0 tabular-nums">
                {entry.expired ? 'venció ' : entry.coupon.active ? 'hasta ' : 'pausa · '}
                {entry.end}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
