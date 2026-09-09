import { describe, expect, it } from "vitest";
import { scaleDiscountsToCap } from "../../src/scale-discounts-to-cap";

describe("scaleDiscountsToCap", () => {
  it("no cambia nada si el bruto no supera el tope (caso ya cubierto por el SDD §04)", () => {
    const result = scaleDiscountsToCap(7500, 3525, 10046, 21071);
    expect(result).toEqual({ category: 7500, volume: 3525, coupon: 10046 });
  });

  it("reescala proporcionalmente cuando el bruto supera el tope, y la suma da exacto", () => {
    // caso real reportado: $640, categoria 10%=6400, volumen 5%=2880, cupon 30%=16416
    // bruto=25696, tope 35% de 64000 = 22400
    const result = scaleDiscountsToCap(6400, 2880, 16416, 22400);
    expect(result.category + result.volume + result.coupon).toBe(22400);
    // ninguna linea debe quedar mayor a su monto original sin topar
    expect(result.category).toBeLessThanOrEqual(6400);
    expect(result.volume).toBeLessThanOrEqual(2880);
    expect(result.coupon).toBeLessThanOrEqual(16416);
  });

  it("el remanente de redondeo va a la linea con mayor monto, nunca se pierde ni se duplica", () => {
    const result = scaleDiscountsToCap(12000, 5400, 30780, 42000);
    expect(result.category + result.volume + result.coupon).toBe(42000);
  });

  it("3 lineas empatadas: el redondeo deja un remanente y se lo lleva la primera de mayor monto", () => {
    // ratio 1/3 sobre 100+100+100: cada linea redondea a 33, sobra 1 (100-99)
    const result = scaleDiscountsToCap(100, 100, 100, 100);
    expect(result).toEqual({ category: 34, volume: 33, coupon: 33 });
    expect(result.category + result.volume + result.coupon).toBe(100);
  });

  it("no divide por cero si las 3 lineas son 0 (ningun descuento aplico)", () => {
    const result = scaleDiscountsToCap(0, 0, 0, 0);
    expect(result).toEqual({ category: 0, volume: 0, coupon: 0 });
  });

  it("respeta lineas en 0 (p.ej. sin cupon) al reescalar solo las que aplicaron", () => {
    const result = scaleDiscountsToCap(6400, 2880, 0, 8000);
    expect(result.coupon).toBe(0);
    expect(result.category + result.volume).toBe(8000);
  });
});
