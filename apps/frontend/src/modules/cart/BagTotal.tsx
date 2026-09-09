import { Price } from '@/shared/ui/Price'
import { cn } from '@/shared/lib/cn'

export function BagTotal({
  amount,
  align = 'start',
  size = 'md',
}: {
  amount: number
  align?: 'start' | 'end'
  size?: 'md' | 'lg'
}) {
  return (
    <div className={cn('flex min-w-0 flex-col', align === 'end' && 'items-end text-right')}>
      <span className="type-kicker">Total</span>
      <Price
        display
        amount={amount}
        className={cn('mt-1', size === 'lg' ? 'text-[2rem] sm:text-[2.35rem]' : 'text-[1.5rem]')}
      />
    </div>
  )
}
