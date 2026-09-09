import { create } from 'zustand'
import { fromCents, toCents } from '@/shared/lib/money'
import { PRODUCTS } from './seed'
import type { ProductDto } from '@/shared/types'

export interface ProductDraft {
  name: string
  category: string
  price: number
  stock: number
  icon?: string
}

function seedCopy(): ProductDto[] {
  return PRODUCTS.map((product) => ({ ...product }))
}

function clampStock(stock: number): number {
  return Math.min(999, Math.max(0, Math.round(stock)))
}

function slugId(name: string, taken: Set<string>): string {
  const slug =
    name
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'pieza'
  let id = `p-${slug}`
  let n = 2
  while (taken.has(id)) {
    id = `p-${slug}-${n}`
    n += 1
  }
  return id
}

interface CatalogBookState {
  products: ProductDto[]
  add: (draft: ProductDraft) => ProductDto
  update: (productId: string, draft: ProductDraft) => ProductDto | undefined
  remove: (productId: string) => ProductDto | undefined
  setStock: (productId: string, stock: number) => ProductDto | undefined
  decrementStock: (items: Array<{ productId: string; quantity: number }>) => void
  reset: () => void
}

export const useCatalogBook = create<CatalogBookState>((set, get) => ({
  products: seedCopy(),
  add: (draft) => {
    const product: ProductDto = {
      id: slugId(draft.name, new Set(get().products.map((item) => item.id))),
      name: draft.name.trim(),
      category: draft.category.trim(),
      price: fromCents(toCents(draft.price)),
      stock: clampStock(draft.stock),
    }
    set({ products: [...get().products, product] })
    return product
  },
  update: (productId, draft) => {
    let updated: ProductDto | undefined
    set({
      products: get().products.map((product) => {
        if (product.id !== productId) return product
        updated = {
          ...product,
          name: draft.name.trim(),
          category: draft.category.trim(),
          price: fromCents(toCents(draft.price)),
          stock: clampStock(draft.stock),
        }
        return updated
      }),
    })
    return updated
  },
  remove: (productId) => {
    const removed = get().products.find((product) => product.id === productId)
    if (!removed) return undefined
    set({ products: get().products.filter((product) => product.id !== productId) })
    return removed
  },
  setStock: (productId, stock) => {
    const current = get().products.find((product) => product.id === productId)
    if (!current) return undefined
    return get().update(productId, { ...current, stock })
  },
  decrementStock: (items) => {
    const byId = new Map(items.map((item) => [item.productId, item.quantity]))
    set({
      products: get().products.map((product) => {
        const quantity = byId.get(product.id)
        if (!quantity) return product
        return { ...product, stock: Math.max(0, product.stock - quantity) }
      }),
    })
  },
  reset: () => set({ products: seedCopy() }),
}))
