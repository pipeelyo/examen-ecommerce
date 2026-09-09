import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from './Button'

export const Dialog = DialogPrimitive.Root
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

export function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn('motion-fade fixed inset-0 z-50 bg-ink/55', className)}
      {...props}
    />
  )
}

export function DialogContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'motion-fade liquidglass fixed inset-x-4 bottom-4 z-50 max-h-[86svh] overflow-y-auto rounded-[1.5rem] p-7 sm:inset-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mb-6 flex items-start justify-between gap-4', className)} {...props} />
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('type-page', className)}
      {...props}
    />
  )
}

interface AdminDialogProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function AdminDialog({ open, title, onClose, children }: AdminDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogClose asChild>
            <Button type="button" variant="link">
              Cerrar
            </Button>
          </DialogClose>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
