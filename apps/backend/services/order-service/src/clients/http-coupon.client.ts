import type { CouponClient, ResolveCouponResult } from "./coupon.client";

export class HttpCouponClient implements CouponClient {
  constructor(
    private readonly baseUrl: string,
    private readonly internalToken: string,
  ) {}

  async resolve(code: string): Promise<ResolveCouponResult> {
    const res = await fetch(`${this.baseUrl}/internal/coupons/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": this.internalToken,
      },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      throw new Error(`coupon-service resolve respondio ${res.status}`);
    }
    return (await res.json()) as ResolveCouponResult;
  }
}
