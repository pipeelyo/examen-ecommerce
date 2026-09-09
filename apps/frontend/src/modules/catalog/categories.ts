import { Armchair, BookOpen, Cpu, Lamp, Shirt, type LucideIcon } from 'lucide-react'

export const CATEGORY_ICON: Record<string, LucideIcon> = {
  Tecnología: Cpu,
  Libros: BookOpen,
  Muebles: Armchair,
  Hogar: Lamp,
  Ropa: Shirt,
}

export const CATEGORY_TONE: Record<string, string> = {
  Tecnología: '#e24b1c',
  Libros: '#1b8a4a',
  Muebles: '#d49212',
  Hogar: '#1788a0',
  Ropa: '#d42a72',
}
