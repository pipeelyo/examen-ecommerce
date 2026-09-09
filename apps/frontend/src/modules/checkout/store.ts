import { create } from 'zustand'
import type { CheckoutResponseDto } from '@/shared/types'

interface CheckoutState {
  couponCode?: string
  couponMessage: string | null
  preview: CheckoutResponseDto | null
  previewError: string | null
  orderId: string | null
  confirmError: string | null
  confirming: boolean
  previewEpoch: number
  setCouponCode: (code: string | undefined) => void
  setCouponMessage: (message: string | null) => void
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
  preview: null,
  previewError: null,
  orderId: null,
  confirmError: null,
  confirming: false,
  previewEpoch: 0,
  setCouponCode: (couponCode) => set((state) => (state.couponCode === couponCode ? state : { couponCode, orderId: null })),
  setCouponMessage: (couponMessage) =>
    set((state) => (state.couponMessage === couponMessage ? state : { couponMessage })),
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
