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
      couponDiscountPct: undefined,
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

  it('guarda el discountPct real de la API, no un valor mockeado (bug: KATA1 al 10% se mostraba como 15%)', async () => {
    mockedGetCoupon.mockResolvedValue({
      code: 'KATA1',
      valid: true,
      discountPct: 0.1,
    })
    const user = userEvent.setup()
    render(<CouponForm />)
    await user.type(screen.getByLabelText('Cupón'), 'KATA1')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    await vi.waitFor(() => expect(useCheckoutStore.getState().couponCode).toBe('KATA1'))
    expect(useCheckoutStore.getState().couponDiscountPct).toBe(0.1)
  })
})
