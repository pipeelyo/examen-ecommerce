import { useEffect } from 'react'
import { selectCheckoutItems, selectCheckoutKey, useCartStore } from '@/modules/cart/store'
import { previewCheckout } from '@/shared/api/commerce'
import { ApiError } from '@/shared/api/client'
import { useCheckoutStore } from './store'

export function PreviewSync() {
  const itemsKey = useCartStore(selectCheckoutKey)
  const couponCode = useCheckoutStore((s) => s.couponCode)
  const previewEpoch = useCheckoutStore((s) => s.previewEpoch)
  const setPreview = useCheckoutStore((s) => s.setPreview)
  const setPreviewError = useCheckoutStore((s) => s.setPreviewError)

  useEffect(() => {
    const items = selectCheckoutItems(useCartStore.getState())
    if (items.length > 0 && useCheckoutStore.getState().orderId) {
      useCheckoutStore.getState().resetOrder()
    }
    if (items.length === 0) {
      const current = useCheckoutStore.getState()
      if (current.preview !== null) setPreview(null)
      if (current.previewError !== null) setPreviewError(null)
      return
    }

    const handle = window.setTimeout(() => {
      void previewCheckout({ items, couponCode })
        .then((preview) => {
          setPreview(preview)
          setPreviewError(null)
        })
        .catch((err: unknown) => {
          setPreview(null)
          setPreviewError(err instanceof ApiError ? err.body.message : 'No se pudo calcular el preview')
        })
    }, 300)

    return () => window.clearTimeout(handle)
  }, [itemsKey, couponCode, previewEpoch, setPreview, setPreviewError])

  return null
}
