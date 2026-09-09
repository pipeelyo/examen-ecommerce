import type { CheckoutResponseDto } from './dto.js';

export const goldenPreviewWelcome: CheckoutResponseDto = {
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
};
