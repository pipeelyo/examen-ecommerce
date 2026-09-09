import { Package, ScrollText, Ticket, type LucideIcon } from 'lucide-react'

export const ADMIN_SECTIONS = [
  { id: 'products', hash: 'productos', label: 'Productos', hint: 'Catálogo y existencias' },
  { id: 'coupons', hash: 'cupones', label: 'Cupones', hint: 'Libro y vigencia' },
  { id: 'audit', hash: 'bitacora', label: 'Bitácora', hint: 'Traza de auditoría' },
] as const

export type AdminSection = (typeof ADMIN_SECTIONS)[number]['id']

export const SECTION_ICON: Record<AdminSection, LucideIcon> = {
  products: Package,
  coupons: Ticket,
  audit: ScrollText,
}

export function sectionFromHash(hash = window.location.hash): AdminSection {
  const value = hash.replace(/^#/, '')
  const match = ADMIN_SECTIONS.find((section) => section.hash === value)
  return match?.id ?? 'products'
}

export function metaForSection(id: AdminSection) {
  const match = ADMIN_SECTIONS.find((item) => item.id === id)
  if (!match) throw new Error(`unknown admin section: ${id}`)
  return match
}

export function hashForSection(id: AdminSection): string {
  return metaForSection(id).hash
}
