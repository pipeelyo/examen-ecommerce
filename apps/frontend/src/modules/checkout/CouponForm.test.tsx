import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CouponForm } from './CouponForm'
import { useCheckoutStore } from './store'
import { ApiError } from '@/shared/api/client'
import { getCoupon } from '@/shared/api/commerce'

vi.mock('@/shared/api/commerce', () => ({
  getCoupon: vi.fn(),
}))

const mockedGetCoupon = vi.mocked(getCoupon)

describe('CouponForm', () => {
  beforeEach(() => {
    mockedGetCoupon.mockReset()
    useCheckoutStore.setState({
      couponCode: undefined,
      couponMessage: null,
    })
  })

  it('shows INVALID when the coupon does not exist', async () => {
    mockedGetCoupon.mockRejectedValue(
      new ApiError(404, { code: 'NOT_FOUND', message: 'Coupon not found' }),
    )
    const user = userEvent.setup()
    render(<CouponForm />)
    await user.type(screen.getByLabelText('Cupón'), 'NOSUCH')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByRole('status')).toHaveTextContent('INVALID')
  })

  it('shows EXPIRED when the coupon is no longer valid', async () => {
    mockedGetCoupon.mockResolvedValue({
      code: 'EXPIRED2025',
      valid: false,
      reason: 'EXPIRED',
    })
    const user = userEvent.setup()
    render(<CouponForm />)
    await user.type(screen.getByLabelText('Cupón'), 'EXPIRED2025')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByRole('status')).toHaveTextContent('EXPIRED')
  })
})
