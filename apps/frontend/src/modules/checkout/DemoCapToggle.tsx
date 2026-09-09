import { setForceCap } from '@/mocks/demoFlags'
import { CheckField } from '@/shared/ui/Field'
import { useCheckoutStore } from './store'

export function DemoCapToggle() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return null

  return (
    <CheckField
      className="mt-2"
      onChange={(event) => {
        setForceCap(event.target.checked)
        const checkout = useCheckoutStore.getState()
        checkout.resetOrder()
        checkout.bumpPreview()
      }}
    >
      <span className="type-caption">Forzar tope 35% (demo)</span>
    </CheckField>
  )
}
