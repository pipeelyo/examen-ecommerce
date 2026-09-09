import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { ProductDto } from '@/shared/types'
import { moneyOf } from '@/shared/lib/money'

export interface CartLine {
  product: ProductDto
  quantity: number
}

interface CartState {
  lines: Record<string, CartLine>
  sheetOpen: boolean
  pulse: { id: string; at: number } | null
  add: (product: ProductDto) => boolean
  increment: (productId: string) => void
  decrement: (productId: string) => void
  remove: (productId: string) => void
  syncProduct: (product: ProductDto) => void
  clear: () => void
  openSheet: () => void
  closeSheet: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: {},
  sheetOpen: false,
  pulse: null,
  add: (product) => {
    if (product.stock <= 0) return false
    const current = get().lines[product.id]
    const quantity = current?.quantity ?? 0
    if (quantity >= product.stock) return false
    set({
      lines: {
        ...get().lines,
        [product.id]: { product, quantity: quantity + 1 },
      },
      pulse: { id: product.id, at: Date.now() },
    })
    return true
  },
  increment: (productId) => {
    const line = get().lines[productId]
    if (!line || line.quantity >= line.product.stock) return
    set({
      lines: {
        ...get().lines,
        [productId]: { ...line, quantity: line.quantity + 1 },
      },
      pulse: { id: productId, at: Date.now() },
    })
  },
  decrement: (productId) => {
    const line = get().lines[productId]
    if (!line) return
    if (line.quantity <= 1) {
      const rest = { ...get().lines }
      delete rest[productId]
      set({ lines: rest })
      return
    }
    set({
      lines: {
        ...get().lines,
        [productId]: { ...line, quantity: line.quantity - 1 },
      },
    })
  },
  remove: (productId) => {
    const rest = { ...get().lines }
    delete rest[productId]
    set({ lines: rest })
  },
  syncProduct: (product) => {
    const line = get().lines[product.id]
    if (!line) return
    if (product.stock <= 0) {
      const rest = { ...get().lines }
      delete rest[product.id]
      set({ lines: rest })
      return
    }
    set({
      lines: {
        ...get().lines,
        [product.id]: { product, quantity: Math.min(line.quantity, product.stock) },
      },
    })
  },
  clear: () => set({ lines: {} }),
  openSheet: () => set({ sheetOpen: true }),
  closeSheet: () => set({ sheetOpen: false }),
}))

export function selectLines(state: CartState): CartLine[] {
  return Object.values(state.lines)
}

/** Hook-safe: caches the snapshot so React 19 does not loop. Do not pass `selectLines` to `useCartStore`. */
export function useCartLines(): CartLine[] {
  return useCartStore(useShallow((state) => Object.values(state.lines)))
}

export function selectSubtotal(state: CartState): number {
  return selectLines(state).reduce((sum, line) => sum + moneyOf(line.product.price, line.quantity), 0)
}

export function selectItemCount(state: CartState): number {
  return selectLines(state).reduce((sum, line) => sum + line.quantity, 0)
}

export function selectCheckoutItems(state: CartState) {
  return selectLines(state).map((line) => ({
    productId: line.product.id,
    quantity: line.quantity,
  }))
}

export function selectCheckoutKey(state: CartState): string {
  return selectCheckoutItems(state)
    .map((item) => `${item.productId}:${item.quantity}`)
    .join('|')
}
