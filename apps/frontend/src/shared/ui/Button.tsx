import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/shared/lib/cn'

// hover:-translate-y-px + active:translate-y-0 daba feedback de "presionado"
// solo en mouse: en touch el hover nunca se dispara, asi que active:translate-y-0
// no cancelaba nada visible — tocar un boton no se sentia distinto de no
// tocarlo. active:scale-[0.97] es un efecto propio (no depende del hover)
// que se ve igual en touch y en mouse.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[0.9375rem] font-medium transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-copper-deep',
        copper: 'bg-copper text-primary-foreground hover:bg-copper-deep',
        ink: 'bg-ink text-card hover:bg-ink/90',
        ghost: 'border border-line bg-card text-ink hover:border-ink/30',
        glass: 'btn-glass text-ink',
        destructive: 'border border-danger/40 bg-card text-danger hover:border-danger',
        link: 'text-muted underline underline-offset-4 hover:text-ink',
      },
      size: {
        default: 'min-h-[var(--thumb)] px-6',
        sm: 'min-h-9 px-4 text-[0.8125rem]',
        icon: 'h-[var(--thumb)] w-[var(--thumb)] p-0',
      },
    },
    defaultVariants: {
      variant: 'copper',
      size: 'default',
    },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'
