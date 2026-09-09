import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DiscountCapAlert, DISCOUNT_CAP_MESSAGE } from './DiscountCapAlert'

describe('DiscountCapAlert', () => {
  it('renders the exact HU-4 copy when visible', () => {
    render(<DiscountCapAlert visible />)
    expect(screen.getByRole('alert')).toHaveTextContent(DISCOUNT_CAP_MESSAGE)
  })

  it('renders nothing when hidden', () => {
    const { container } = render(<DiscountCapAlert visible={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
