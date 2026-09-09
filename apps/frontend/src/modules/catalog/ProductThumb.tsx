import type { ReactNode } from 'react'
import type { ProductDto } from '@/shared/types'
import { cn } from '@/shared/lib/cn'
import { CATEGORY_TONE } from './categories'

function Plate({
  tone,
  children,
}: {
  tone: string
  children: ReactNode
}) {
  return (
    <svg viewBox="0 0 120 120" className="size-full" aria-hidden>
      <rect width="120" height="120" fill="#fff8ee" />
      <rect x="8" y="8" width="104" height="104" rx="10" fill={tone} opacity="0.1" />
      {children}
    </svg>
  )
}

function Illustration({ id, tone }: { id: string; tone: string }) {
  switch (id) {
    case 'p-laptop':
      return (
        <Plate tone={tone}>
          <rect x="22" y="32" width="76" height="48" rx="3" fill={tone} />
          <rect x="26" y="36" width="68" height="36" fill="#fff8ee" />
          <rect x="18" y="80" width="84" height="6" rx="2" fill={tone} opacity="0.55" />
        </Plate>
      )
    case 'p-mouse':
      return (
        <Plate tone={tone}>
          <ellipse cx="60" cy="62" rx="22" ry="30" fill={tone} />
          <rect x="58" y="38" width="4" height="16" rx="2" fill="#fff8ee" />
        </Plate>
      )
    case 'p-libro':
    case 'p-atlas':
    case 'p-cuaderno':
      return (
        <Plate tone={tone}>
          <rect x="34" y="24" width="52" height="72" rx="2" fill={tone} />
          <rect x="38" y="28" width="40" height="64" fill="#fff8ee" />
          <rect x="42" y="40" width="28" height="3" fill={tone} opacity="0.35" />
          <rect x="42" y="48" width="22" height="3" fill={tone} opacity="0.35" />
        </Plate>
      )
    case 'p-silla':
      return (
        <Plate tone={tone}>
          <rect x="36" y="34" width="48" height="10" rx="2" fill={tone} />
          <rect x="40" y="44" width="40" height="28" rx="2" fill={tone} opacity="0.75" />
          <rect x="40" y="72" width="6" height="22" fill={tone} />
          <rect x="74" y="72" width="6" height="22" fill={tone} />
        </Plate>
      )
    case 'p-tablet':
      return (
        <Plate tone={tone}>
          <rect x="32" y="22" width="56" height="76" rx="6" fill={tone} />
          <rect x="38" y="30" width="44" height="54" fill="#fff8ee" />
          <circle cx="60" cy="90" r="3" fill="#fff8ee" />
        </Plate>
      )
    case 'p-lampara':
      return (
        <Plate tone={tone}>
          <rect x="56" y="28" width="8" height="44" fill={tone} />
          <path d="M40 32h40l-8 18H48z" fill={tone} opacity="0.8" />
          <rect x="42" y="86" width="36" height="8" rx="2" fill={tone} />
        </Plate>
      )
    case 'p-teclado':
      return (
        <Plate tone={tone}>
          <rect x="18" y="44" width="84" height="32" rx="4" fill={tone} />
          <rect x="24" y="50" width="10" height="8" rx="1" fill="#fff8ee" />
          <rect x="38" y="50" width="10" height="8" rx="1" fill="#fff8ee" />
          <rect x="52" y="50" width="10" height="8" rx="1" fill="#fff8ee" />
          <rect x="66" y="50" width="10" height="8" rx="1" fill="#fff8ee" />
          <rect x="80" y="50" width="14" height="8" rx="1" fill="#fff8ee" />
          <rect x="28" y="62" width="64" height="8" rx="1" fill="#fff8ee" />
        </Plate>
      )
    case 'p-mesa':
      return (
        <Plate tone={tone}>
          <rect x="20" y="46" width="80" height="10" rx="2" fill={tone} />
          <rect x="26" y="56" width="8" height="32" fill={tone} />
          <rect x="86" y="56" width="8" height="32" fill={tone} />
        </Plate>
      )
    case 'p-banqueta':
      return (
        <Plate tone={tone}>
          <ellipse cx="60" cy="48" rx="28" ry="8" fill={tone} />
          <rect x="34" y="50" width="6" height="34" fill={tone} />
          <rect x="80" y="50" width="6" height="34" fill={tone} />
        </Plate>
      )
    case 'p-aparador':
      return (
        <Plate tone={tone}>
          <rect x="24" y="32" width="72" height="56" rx="2" fill={tone} />
          <line x1="60" y1="32" x2="60" y2="88" stroke="#fff8ee" strokeWidth="2" />
          <circle cx="52" cy="60" r="2.5" fill="#fff8ee" />
          <circle cx="68" cy="60" r="2.5" fill="#fff8ee" />
        </Plate>
      )
    case 'p-jarron':
      return (
        <Plate tone={tone}>
          <path d="M48 28h24l-4 18 8 48H44l8-48z" fill={tone} />
        </Plate>
      )
    case 'p-manta':
      return (
        <Plate tone={tone}>
          <rect x="28" y="30" width="64" height="60" rx="3" fill={tone} />
          <rect x="34" y="36" width="52" height="48" fill="#fff8ee" opacity="0.35" />
        </Plate>
      )
    case 'p-candelabro':
      return (
        <Plate tone={tone}>
          <rect x="57" y="58" width="6" height="30" fill={tone} />
          <path d="M28 58h64" stroke={tone} strokeWidth="6" strokeLinecap="round" />
          <rect x="30" y="38" width="6" height="20" fill={tone} />
          <rect x="84" y="38" width="6" height="20" fill={tone} />
          <rect x="48" y="88" width="24" height="6" rx="2" fill={tone} />
        </Plate>
      )
    case 'p-delantal':
    case 'p-chaqueta':
      return (
        <Plate tone={tone}>
          <path d="M40 34l20-8 20 8v54H40z" fill={tone} />
          <path d="M40 34l-10 16h10zM80 34l10 16H80z" fill={tone} opacity="0.7" />
        </Plate>
      )
    case 'p-bufanda':
      return (
        <Plate tone={tone}>
          <path d="M28 40c24-16 40 8 64 0v16c-24 10-40-14-64 0z" fill={tone} />
          <rect x="28" y="54" width="12" height="28" fill={tone} opacity="0.7" />
        </Plate>
      )
    default:
      return (
        <Plate tone={tone}>
          <rect x="36" y="36" width="48" height="48" rx="8" fill={tone} />
        </Plate>
      )
  }
}

export function ProductThumb({ product, className }: { product: ProductDto; className?: string }) {
  const tone = CATEGORY_TONE[product.category] ?? '#c45c32'

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-[1.05rem] bg-card shadow-[inset_0_0_0_1px_rgba(28,20,16,0.06)]',
        className,
      )}
    >
      <Illustration id={product.id} tone={tone} />
      <span className="sr-only">{product.category}</span>
    </div>
  )
}
