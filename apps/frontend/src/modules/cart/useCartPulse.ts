import { useEffect, useState } from 'react'
import { useCartStore } from './store'

export function useCartPulse(productId: string): boolean {
  const at = useCartStore((state) => (state.pulse?.id === productId ? state.pulse.at : 0))
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!at) return
    setActive(false)
    const frame = window.requestAnimationFrame(() => setActive(true))
    const hide = window.setTimeout(() => setActive(false), 620)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(hide)
    }
  }, [at])

  return active
}
