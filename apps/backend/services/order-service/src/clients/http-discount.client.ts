import type {
  CalculateInput,
  CheckoutBreakdown,
  DiscountClient,
} from "./discount.client";

export class HttpDiscountClient implements DiscountClient {
  constructor(
    private readonly baseUrl: string,
    private readonly internalToken: string,
  ) {}

  async calculate(input: CalculateInput): Promise<CheckoutBreakdown> {
    const res = await fetch(`${this.baseUrl}/internal/discounts/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": this.internalToken,
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(`discount-service calculate respondio ${res.status}`);
    }
    return (await res.json()) as CheckoutBreakdown;
  }
}
