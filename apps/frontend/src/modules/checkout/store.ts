import { create } from 'zustand'
import type { CheckoutResponseDto } from '@/shared/types'

interface CheckoutState {
  couponCode?: string
  couponMessage: string | null
  /** Fracción (0.10 = 10%), tal como la devuelve la API — nunca un valor mockeado. */
  couponDiscountPct?: number
  preview: CheckoutResponseDto | null
  previewError: string | null
  orderId: string | null
  confirmError: string | null
  confirming: boolean
  previewEpoch: number
  setCouponCode: (code: string | undefined) => void
  setCouponMessage: (message: string | null) => void
  setCouponDiscountPct: (pct: number | undefined) => void
  setPreview: (preview: CheckoutResponseDto | null) => void
  setPreviewError: (message: string | null) => void
  setOrderId: (id: string | null) => void
  setConfirmError: (message: string | null) => void
  setConfirming: (value: boolean) => void
  resetOrder: () => void
  bumpPreview: () => void
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  couponCode: undefined,
  couponMessage: null,
  couponDiscountPct: undefined,
  preview: null,
  previewError: null,
  orderId: null,
  confirmError: null,
  confirming: false,
  previewEpoch: 0,
  setCouponCode: (couponCode) =>
    set((state) =>
      state.couponCode === couponCode
        ? state
        : { couponCode, orderId: null, couponDiscountPct: couponCode ? state.couponDiscountPct : undefined },
    ),
  setCouponMessage: (couponMessage) =>
    set((state) => (state.couponMessage === couponMessage ? state : { couponMessage })),
  setCouponDiscountPct: (couponDiscountPct) =>
    set((state) => (state.couponDiscountPct === couponDiscountPct ? state : { couponDiscountPct })),
  setPreview: (preview) => set((state) => (state.preview === preview ? state : { preview })),
  setPreviewError: (previewError) =>
    set((state) => (state.previewError === previewError ? state : { previewError })),
  setOrderId: (orderId) => set((state) => (state.orderId === orderId ? state : { orderId })),
  setConfirmError: (confirmError) =>
    set((state) => (state.confirmError === confirmError ? state : { confirmError })),
  setConfirming: (confirming) => set((state) => (state.confirming === confirming ? state : { confirming })),
  resetOrder: () =>
    set((state) =>
      state.orderId === null && state.confirmError === null ? state : { orderId: null, confirmError: null },
    ),
  bumpPreview: () => set((state) => ({ previewEpoch: state.previewEpoch + 1 })),
}))
