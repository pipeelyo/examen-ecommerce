import { describe, expect, it } from "vitest";
import { addItem, cartLines, getCart, removeItem, resetCart } from "./cart";
import { CAP_ALERT } from "./App";

describe("cart", () => {
  it("agrega y quita líneas", () => {
    resetCart();
    addItem("laptop", 10);
    addItem("laptop", 10);
    expect(cartLines()).toEqual([{ productId: "laptop", quantity: 2 }]);
    removeItem("laptop");
    expect(getCart().quantities.laptop).toBe(1);
  });

  it("no supera stock", () => {
    resetCart();
    addItem("cable", 2);
    addItem("cable", 2);
    addItem("cable", 2);
    expect(getCart().quantities.cable).toBe(2);
  });
});

describe("alerta 35%", () => {
  it("usa el copy del enunciado", () => {
    expect(CAP_ALERT).toBe(
      "¡Enhorabuena! Has alcanzado el límite máximo de ahorro permitido (35%)",
    );
  });
});
