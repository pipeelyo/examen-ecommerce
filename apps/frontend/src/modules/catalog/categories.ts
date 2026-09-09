import { Armchair, BookOpen, Cpu, Lamp, Puzzle, Shirt, type LucideIcon } from 'lucide-react'

export const CATEGORY_ICON: Record<string, LucideIcon> = {
  Tecnología: Cpu,
  Libros: BookOpen,
  Muebles: Armchair,
  Hogar: Lamp,
  Juguetería: Puzzle,
  Ropa: Shirt,
}

export const CATEGORY_TONE: Record<string, string> = {
  Tecnología: '#e24b1c',
  Libros: '#1b8a4a',
  Muebles: '#d49212',
  Hogar: '#1788a0',
  Juguetería: '#7c3aed',
  Ropa: '#d42a72',
}

const CATEGORY_STORAGE_NAMES: Record<string, string> = {
  Tecnología: 'Tecnologia',
  Juguetería: 'Jugueteria',
}

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  Tecnologia: 'Tecnología',
  Jugueteria: 'Juguetería',
}

export function displayCategoryName(name: string): string {
  return CATEGORY_DISPLAY_NAMES[name] ?? name
}

export function storageCategoryName(name: string): string {
  return CATEGORY_STORAGE_NAMES[name] ?? name
}
