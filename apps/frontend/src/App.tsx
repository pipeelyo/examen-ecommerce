import { useEffect, useSyncExternalStore, useState } from "react";
import {
  addItem,
  cartLines,
  getCart,
  removeItem,
  resetCart,
  setCoupon,
  subscribeCart,
  type Product,
  type QuoteResponse,
} from "./cart";
import "./App.css";

export const CAP_ALERT =
  "¡Enhorabuena! Has alcanzado el límite máximo de ahorro permitido (35%)";

export function App() {
  const cart = useSyncExternalStore(subscribeCart, getCart, getCart);
  const [products, setProducts] = useState<Product[]>([]);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    const res = await fetch("/api/products");
    setProducts((await res.json()) as Product[]);
  }

  async function applyCoupon() {
    await postQuote();
  }

  async function postQuote() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: cartLines(),
          couponCode: getCart().coupon || undefined,
        }),
      });
      const data = (await res.json()) as QuoteResponse & { message?: string };
      if (!res.ok) {
        throw new Error(data.message || "No se pudo cotizar");
      }
      setQuote(data);
    } catch (err) {
      setQuote(null);
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: cartLines(),
          couponCode: getCart().coupon || undefined,
        }),
      });
      const data = (await res.json()) as QuoteResponse & { message?: string };
      if (!res.ok) {
        throw new Error(data.message || "No se pudo confirmar");
      }
      setQuote(data);
      resetCart();
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const original = products.reduce((sum, product) => {
    const qty = cart.quantities[product.id] ?? 0;
    return sum + product.unitPrice * qty;
  }, 0);

  return (
    <main className="page">
      <h1>Core E-Commerce</h1>
      <p className="lead">Checkout con descuentos acumulativos.</p>

      {quote?.breakdown.capApplied ? (
        <div className="banner" role="alert">
          {CAP_ALERT}
        </div>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      <section>
        <h2>Productos</h2>
        <ul className="grid">
          {products.map((product) => (
            <li key={product.id} className="card">
              <strong>{product.name}</strong>
              <span>
                ${product.unitPrice} · {product.category} · stock {product.stock}
              </span>
              <div className="row">
                <button type="button" onClick={() => removeItem(product.id)}>
                  −
                </button>
                <span>{cart.quantities[product.id] ?? 0}</span>
                <button
                  type="button"
                  onClick={() => addItem(product.id, product.stock)}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Carrito</h2>
        <p>Subtotal original: ${original.toFixed(2)}</p>
        <label>
          Cupón
          <input
            value={cart.coupon}
            onChange={(event) => setCoupon(event.target.value)}
            placeholder="WELCOME2026"
          />
        </label>
        <div className="row">
          <button type="button" disabled={busy} onClick={() => void applyCoupon()}>
            Aplicar cupón
          </button>
          <button type="button" disabled={busy} onClick={() => void checkout()}>
            Confirmar orden
          </button>
        </div>
      </section>

      {quote ? (
        <section>
          <h2>Desglose</h2>
          <ul>
            <li>Categoría: ${quote.breakdown.categoryAmount.toFixed(2)}</li>
            <li>Volumen: ${quote.breakdown.volumeAmount.toFixed(2)}</li>
            <li>Cupón: ${quote.breakdown.couponAmount.toFixed(2)}</li>
            <li>Ahorro: ${quote.breakdown.totalAmount.toFixed(2)}</li>
            <li>Efectivo: {quote.breakdown.effectivePercent.toFixed(2)}%</li>
            <li>A pagar: ${quote.payable.toFixed(2)}</li>
            {quote.orderId ? <li>Orden: {quote.orderId}</li> : null}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
