import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface CommerceBarProps {
  left: ReactNode
  actionLabel: string
  onAction: () => void
  disabled?: boolean
  className?: string
}

export function CommerceBar({ left, actionLabel, onAction, disabled, className }: CommerceBarProps) {
  return (
    <div
      className={cn(
        'glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 px-5 py-4 lg:hidden',
        className,
      )}
    >
      <div className="min-w-0">{left}</div>
      <button
        type="button"
        disabled={disabled}
        onClick={onAction}
        className="inline-flex min-h-[var(--thumb)] shrink-0 items-center rounded-full bg-copper px-6 text-[0.9375rem] font-medium text-[#fff8ee] disabled:opacity-45"
      >
        {actionLabel}
      </button>
    </div>
  )
}
