import type { ProductDto } from '@/shared/types'

export const PRODUCTS: ProductDto[] = [
  { id: 'p-laptop', name: 'Laptop', category: 'Tecnología', price: 700, stock: 10 },
  { id: 'p-mouse', name: 'Mouse', category: 'Tecnología', price: 50, stock: 20 },
  { id: 'p-libro', name: 'Libro', category: 'Libros', price: 30, stock: 15 },
  { id: 'p-silla', name: 'Silla', category: 'Muebles', price: 349, stock: 0 },
  { id: 'p-tablet', name: 'Tablet de dibujo', category: 'Tecnología', price: 429.9, stock: 6 },
  { id: 'p-lampara', name: 'Lámpara de escritorio', category: 'Tecnología', price: 84.5, stock: 11 },
  { id: 'p-teclado', name: 'Teclado mecánico', category: 'Tecnología', price: 139.99, stock: 7 },
  { id: 'p-cuaderno', name: 'Cuaderno de taller', category: 'Libros', price: 16.9, stock: 23 },
  { id: 'p-atlas', name: 'Atlas de oficios', category: 'Libros', price: 38.5, stock: 8 },
  { id: 'p-mesa', name: 'Mesa de roble', category: 'Muebles', price: 879, stock: 3 },
  { id: 'p-banqueta', name: 'Banqueta baja', category: 'Muebles', price: 154.9, stock: 7 },
  { id: 'p-aparador', name: 'Aparador estrecho', category: 'Muebles', price: 615, stock: 2 },
  { id: 'p-jarron', name: 'Jarrón de gres', category: 'Hogar', price: 72.9, stock: 13 },
  { id: 'p-manta', name: 'Manta de lana', category: 'Hogar', price: 96.5, stock: 9 },
  { id: 'p-candelabro', name: 'Candelabro de cobre', category: 'Hogar', price: 54.9, stock: 6 },
  { id: 'p-delantal', name: 'Delantal de lino', category: 'Ropa', price: 32.9, stock: 17 },
  { id: 'p-bufanda', name: 'Bufanda merino', category: 'Ropa', price: 44.5, stock: 14 },
  { id: 'p-chaqueta', name: 'Chaqueta de trabajo', category: 'Ropa', price: 119.9, stock: 4 },
]

export const PRODUCT_CATEGORIES = ['Tecnología', 'Libros', 'Muebles', 'Hogar', 'Ropa'] as const

export interface CouponRecord {
  code: string
  discountPct: number
  expiresAt: string
  active: boolean
  productIds: string[]
}

export const COUPONS: CouponRecord[] = [
  {
    code: 'WELCOME2026',
    discountPct: 0.15,
    expiresAt: '2027-12-31T23:59:59.000Z',
    active: true,
    productIds: ['p-laptop'],
  },
  {
    code: 'EXPIRED2025',
    discountPct: 0.15,
    expiresAt: '2025-12-31T23:59:59.000Z',
    active: true,
    productIds: [],
  },
  {
    code: 'TALLER2026',
    discountPct: 0.1,
    expiresAt: '2026-11-30T23:59:59.000Z',
    active: true,
    productIds: [],
  },
  {
    code: 'HOGAR2026',
    discountPct: 0.12,
    expiresAt: '2026-09-30T23:59:59.000Z',
    active: true,
    productIds: ['p-jarron', 'p-manta'],
  },
  {
    code: 'PAUSA2026',
    discountPct: 0.2,
    expiresAt: '2027-06-30T23:59:59.000Z',
    active: false,
    productIds: ['p-mesa'],
  },
]

export const DEMO_BEARER = 'demo'
export const TECH_CATEGORY = 'Tecnología'
export const VOLUME_THRESHOLD_USD = 100
export const CAP_RATIO = 0.35
