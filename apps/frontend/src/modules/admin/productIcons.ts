import {
  Armchair,
  BookOpen,
  Cpu,
  Lamp,
  Laptop,
  Mouse,
  Package,
  Puzzle,
  Shirt,
  Sofa,
  type LucideIcon,
} from 'lucide-react'

export type ProductIconId =
  | 'cpu'
  | 'laptop'
  | 'mouse'
  | 'book'
  | 'armchair'
  | 'sofa'
  | 'lamp'
  | 'puzzle'
  | 'shirt'
  | 'package'

export interface ProductIconOption {
  id: ProductIconId
  label: string
  Icon: LucideIcon
}

const STORAGE_KEY = 'norte.product-icons'

export const PRODUCT_ICON_OPTIONS: ProductIconOption[] = [
  { id: 'cpu', label: 'Tecnología', Icon: Cpu },
  { id: 'laptop', label: 'Portátil', Icon: Laptop },
  { id: 'mouse', label: 'Periférico', Icon: Mouse },
  { id: 'book', label: 'Libros', Icon: BookOpen },
  { id: 'armchair', label: 'Muebles', Icon: Armchair },
  { id: 'sofa', label: 'Sala', Icon: Sofa },
  { id: 'lamp', label: 'Hogar', Icon: Lamp },
  { id: 'puzzle', label: 'Juguetería', Icon: Puzzle },
  { id: 'shirt', label: 'Ropa', Icon: Shirt },
  { id: 'package', label: 'Pieza', Icon: Package },
]

const PRODUCT_ICON_BY_ID: Record<ProductIconId, ProductIconOption> = Object.fromEntries(
  PRODUCT_ICON_OPTIONS.map((option) => [option.id, option]),
) as Record<ProductIconId, ProductIconOption>

const CATEGORY_ICON_ID: Record<string, ProductIconId> = {
  Tecnología: 'cpu',
  Libros: 'book',
  Muebles: 'armchair',
  Hogar: 'lamp',
  Juguetería: 'puzzle',
  Ropa: 'shirt',
}

export function iconIdForCategory(category: string): ProductIconId {
  return CATEGORY_ICON_ID[category] ?? 'package'
}

export function isProductIconId(value: string): value is ProductIconId {
  return value in PRODUCT_ICON_BY_ID
}

export function optionForIcon(id: string): ProductIconOption {
  return isProductIconId(id) ? PRODUCT_ICON_BY_ID[id] : PRODUCT_ICON_BY_ID.package
}

function readMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}

export function rememberProductIcon(productId: string, icon: string): void {
  const next = { ...readMap(), [productId]: icon }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function forgetProductIcon(productId: string): void {
  const next = readMap()
  delete next[productId]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function iconForProduct(productId: string, category: string): ProductIconId {
  const stored = readMap()[productId]
  if (stored && isProductIconId(stored)) return stored
  return iconIdForCategory(category)
}
