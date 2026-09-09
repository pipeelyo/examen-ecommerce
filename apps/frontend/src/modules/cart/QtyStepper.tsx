import { cn } from '@/shared/lib/cn'

interface QtyStepperProps {
  value: number
  max: number
  onIncrement: () => void
  onDecrement: () => void
  labelledBy: string
  compact?: boolean
}

export function QtyStepper({ value, max, onIncrement, onDecrement, labelledBy, compact }: QtyStepperProps) {
  // compact (bolsa/carrito) es size-8 (32px) en desktop, donde el mouse
  // apunta con precision — pero esa misma fila se usa en el CartSheet
  // mobile (lg:hidden), donde 32px queda por debajo del minimo tactil de
  // --thumb (44px). max-lg: lo sube solo en mobile/tablet.
  const size = compact ? 'size-8 max-lg:size-10' : 'size-9'

  return (
    <div className="btn-glass inline-flex w-fit items-center rounded-full" role="group" aria-labelledby={labelledBy}>
      <button
        type="button"
        className={cn('flex items-center justify-center text-base', size)}
        aria-label="Quitar uno"
        onClick={onDecrement}
      >
        −
      </button>
      <span className="min-w-7 text-center tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={cn('flex items-center justify-center text-base', size, value >= max && 'opacity-35')}
        aria-label="Agregar uno"
        disabled={value >= max}
        onClick={onIncrement}
      >
        +
      </button>
    </div>
  )
}
