import { CouponForm } from './CouponForm'
import { DiscountBreakdown } from './DiscountBreakdown'
import { DiscountCapAlert } from './DiscountCapAlert'
import { CheckoutConfirm } from './CheckoutConfirm'
import { DemoCapToggle } from './DemoCapToggle'
import { useCheckoutStore } from './store'

export function CheckoutPanel({ coupon = true }: { coupon?: boolean }) {
  const preview = useCheckoutStore((s) => s.preview)
  const previewError = useCheckoutStore((s) => s.previewError)
  const couponDiscountPct = useCheckoutStore((s) => s.couponDiscountPct)
  const couponPct = couponDiscountPct !== undefined ? Math.round(couponDiscountPct * 100) : undefined

  return (
    <div className="flex flex-col gap-3">
      {coupon ? <CouponForm /> : null}
      {previewError ? (
        <p role="alert" className="text-[0.9375rem] text-danger">
          {previewError}
        </p>
      ) : null}
      {preview ? (
        <>
          <DiscountCapAlert visible={preview.breakdown.cappedAt35} />
          <DiscountBreakdown preview={preview} couponPct={couponPct} />
        </>
      ) : null}
      <CheckoutConfirm />
      <DemoCapToggle />
    </div>
  )
}
