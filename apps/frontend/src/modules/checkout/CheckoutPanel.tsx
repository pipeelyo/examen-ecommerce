import { CouponForm } from './CouponForm'
import { DiscountBreakdown } from './DiscountBreakdown'
import { DiscountCapAlert } from './DiscountCapAlert'
import { CheckoutConfirm } from './CheckoutConfirm'
import { DemoCapToggle } from './DemoCapToggle'
import { findLiveCoupon } from '@/mocks/couponBook'
import { useCheckoutStore } from './store'

export function CheckoutPanel({ coupon = true }: { coupon?: boolean }) {
  const preview = useCheckoutStore((s) => s.preview)
  const previewError = useCheckoutStore((s) => s.previewError)
  const couponCode = useCheckoutStore((s) => s.couponCode)
  const live = couponCode ? findLiveCoupon(couponCode) : undefined
  const couponPct = live ? Math.round(live.discountPct * 100) : 15

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
