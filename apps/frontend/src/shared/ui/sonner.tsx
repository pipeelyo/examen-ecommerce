import { useEffect } from 'react'
import { Toaster as Sonner, toast } from 'sonner'

export function Toaster() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-sonner-toast]')) {
        toast.dismiss()
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            'glass cursor-pointer !rounded-[1.35rem] !border-line !text-ink !px-5 !py-4 !shadow-[0_8px_24px_rgba(28,20,16,0.08),0_28px_64px_rgba(28,20,16,0.22)]',
          title: '!text-[0.975rem] !font-medium',
          actionButton: '!bg-copper !text-primary-foreground',
          closeButton: '!hidden',
        },
      }}
    />
  )
}
