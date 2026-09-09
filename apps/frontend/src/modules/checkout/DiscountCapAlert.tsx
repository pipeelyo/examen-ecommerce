const CAP_MESSAGE =
  '¡Enhorabuena! Has alcanzado el límite máximo de ahorro permitido (35%).'

export function DiscountCapAlert({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <div role="alert" className="glass rounded-2xl px-5 py-4 text-[0.9375rem] text-sage">
      {CAP_MESSAGE}
    </div>
  )
}

export const DISCOUNT_CAP_MESSAGE = CAP_MESSAGE
