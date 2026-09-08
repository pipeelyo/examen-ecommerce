export type Product = {
  id: string;
  name: string;
  unitPrice: number;
  category: string;
  stock: number;
};

export type QuoteResponse = {
  originalSubtotal: number;
  payable: number;
  couponCode: string | null;
  breakdown: {
    categoryAmount: number;
    volumeAmount: number;
    couponAmount: number;
    totalAmount: number;
    effectivePercent: number;
    capApplied: boolean;
  };
  orderId?: string;
};

type Listener = () => void;

export type CartState = {
  quantities: Record<string, number>;
  coupon: string;
};

const listeners = new Set<Listener>();
let state: CartState = { quantities: {}, coupon: "" };

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeCart(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCart(): CartState {
  return state;
}

export function addItem(productId: string, stock: number) {
  const current = state.quantities[productId] ?? 0;
  if (current >= stock) {
    return;
  }
  state = {
    ...state,
    quantities: { ...state.quantities, [productId]: current + 1 },
  };
  emit();
}

export function removeItem(productId: string) {
  const current = state.quantities[productId] ?? 0;
  if (current <= 0) {
    return;
  }
  const next = current - 1;
  const quantities = { ...state.quantities };
  if (next === 0) {
    delete quantities[productId];
  } else {
    quantities[productId] = next;
  }
  state = { ...state, quantities };
  emit();
}

export function setCoupon(coupon: string) {
  state = { ...state, coupon };
  emit();
}

export function resetCart() {
  state = { quantities: {}, coupon: "" };
  emit();
}

export function cartLines(): { productId: string; quantity: number }[] {
  return Object.entries(state.quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));
}
