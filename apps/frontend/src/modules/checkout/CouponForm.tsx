import { type FormEvent, useId, useState } from 'react'
import { Ticket } from 'lucide-react'
import { getCoupon } from '@/shared/api/commerce'
import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { Field, FieldAlert } from '@/shared/ui/Field'
import { useCheckoutStore } from './store'

export function CouponForm({ compact = false }: { compact?: boolean }) {
  const inputId = useId()
  const [value, setValue] = useState('')
  const couponMessage = useCheckoutStore((s) => s.couponMessage)
  const setCouponCode = useCheckoutStore((s) => s.setCouponCode)
  const setCouponMessage = useCheckoutStore((s) => s.setCouponMessage)
  const setCouponDiscountPct = useCheckoutStore((s) => s.setCouponDiscountPct)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const code = value.trim().toUpperCase()
    if (!code) {
      setCouponCode(undefined)
      setCouponMessage(null)
      setCouponDiscountPct(undefined)
      return
    }
    try {
      const result = await getCoupon(code)
      if (!result.valid) {
        setCouponCode(code)
        setCouponMessage(result.reason === 'EXPIRED' ? 'EXPIRED' : 'INVALID')
        setCouponDiscountPct(undefined)
        return
      }
      setCouponCode(result.code)
      setCouponMessage(null)
      setCouponDiscountPct(result.discountPct)
    } catch (err) {
      setCouponDiscountPct(undefined)
      if (err instanceof ApiError && err.status === 404) {
        setCouponCode(code)
        setCouponMessage('INVALID')
        return
      }
      setCouponMessage('INVALID')
    }
  }

  const status =
    couponMessage === 'INVALID' ? (
      <FieldAlert tone="danger" role="status">
        INVALID
      </FieldAlert>
    ) : couponMessage === 'EXPIRED' ? (
      <FieldAlert tone="danger" role="status">
        EXPIRED
      </FieldAlert>
    ) : null

  if (compact) {
    return (
      <form onSubmit={onSubmit} className="flex shrink-0 flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <label htmlFor={inputId} className="sr-only">
            Cupón
          </label>
          <input
            id={inputId}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Cupón"
            autoComplete="off"
            aria-invalid={couponMessage ? true : undefined}
            className="field field-compact flex-1"
          />
          <Button type="submit" variant="ghost" size="sm" className="h-8 min-h-8 px-3">
            <Ticket className="size-3.5" />
            Aplicar
          </Button>
        </div>
        {status ? <div className="text-[0.8125rem] leading-tight [&_p]:text-[0.8125rem]">{status}</div> : null}
      </form>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Field
          id={inputId}
          label="Cupón"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="WELCOME2026"
          autoComplete="off"
          className="flex-1"
        />
        <Button type="submit" variant="ghost">
          <Ticket className="size-3.5" />
          Aplicar
        </Button>
      </div>
      {status}
    </form>
  )
}
