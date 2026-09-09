export interface ScaledDiscounts {
  category: number;
  volume: number;
  coupon: number;
}

/**
 * Cuando el tope del 35% (apply-absolute-cap.ts) recorta el descuento bruto,
 * las 3 lineas (categoria/volumen/cupon) seguian mostrando sus montos SIN
 * topar — category+volume+coupon sumaba mas que totalDiscount, dando la
 * impresion de que se seguia descontando despues de "alcanzar el maximo".
 * Esta funcion reescala las 3 lineas proporcionalmente para que su suma
 * sea exactamente cappedTotal. Si no hubo tope (gross <= cappedTotal),
 * devuelve los montos tal cual — no cambia el caso ya cubierto por el
 * ejemplo del SDD §04.
 */
export function scaleDiscountsToCap(
  category: number,
  volume: number,
  coupon: number,
  cappedTotal: number,
): ScaledDiscounts {
  const gross = category + volume + coupon;
  if (gross <= 0 || gross <= cappedTotal) {
    return { category, volume, coupon };
  }

  const ratio = cappedTotal / gross;
  const scaled = [category, volume, coupon].map((amount) => Math.round(amount * ratio));
  const allocated = scaled[0]! + scaled[1]! + scaled[2]!;
  const remainder = cappedTotal - allocated;

  if (remainder !== 0) {
    let largestIndex = 0;
    for (let i = 1; i < scaled.length; i++) {
      if (scaled[i]! > scaled[largestIndex]!) largestIndex = i;
    }
    scaled[largestIndex] += remainder;
  }

  return { category: scaled[0]!, volume: scaled[1]!, coupon: scaled[2]! };
}
