import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DiscountBreakdown } from './DiscountBreakdown'
import type { CheckoutResponseDto } from '@/shared/types'

const preview: CheckoutResponseDto = {
  orderId: null,
  originalSubtotal: 780,
  breakdown: {
    category: { applied: true, amount: 75 },
    volume: { applied: true, amount: 35.25 },
    coupon: { applied: true, amount: 100.46 },
    cappedAt35: false,
  },
  totalDiscount: 210.71,
  effectiveDiscountPercentage: 27.01,
  finalTotal: 569.29,
}

describe('DiscountBreakdown', () => {
  it('shows the golden total 569.29', () => {
    render(<DiscountBreakdown preview={preview} />)
    expect(screen.getByTestId('discount-breakdown')).toHaveTextContent('$569.29')
    expect(screen.getByTestId('discount-breakdown')).toHaveTextContent('27.01')
  })
})
