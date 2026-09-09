import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { type ComponentProps, forwardRef } from 'react'
import { cn } from '@/shared/lib/cn'

export const ScrollArea = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
    <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit] [&>div]:min-w-full [&>div]:block">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollBar orientation="horizontal" />
    <ScrollAreaPrimitive.Corner className="bg-transparent" />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

export const ScrollBar = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none bg-transparent p-0.5 transition-colors',
      orientation === 'vertical' && 'h-full w-2.5 border-0',
      orientation === 'horizontal' && 'h-2.5 flex-col border-0',
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-ink/35 hover:bg-copper" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName
