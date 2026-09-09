import { useEffect, useState } from 'react'

const DESKTOP_QUERY = '(min-width: 768px)'

export function useDesktopNav() {
  const [desktop, setDesktop] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia(DESKTOP_QUERY).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY)
    const sync = () => setDesktop(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return desktop
}
