import { Body, Controller, Get, Param, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { forward } from "../common/downstream";
import { internalHeaders } from "../common/headers";
import {
  buildPreview,
  type PreviewRequest,
  type ProductLookup,
  type ResolveCouponResult,
} from "./preview.orchestrator";

const CATALOG_URL = () => process.env.CATALOG_SERVICE_URL ?? "http://catalog-service:3002";
const COUPON_URL = () => process.env.COUPON_SERVICE_URL ?? "http://coupon-service:3003";
const DISCOUNT_URL = () => process.env.DISCOUNT_SERVICE_URL ?? "http://discount-service:3001";
const ORDER_URL = () => process.env.ORDER_SERVICE_URL ?? "http://order-service:3004";

function relay(res: Response, result: { status: number; body: unknown }) {
  res.status(result.status).json(result.body);
}

async function getProduct(id: string): Promise<ProductLookup | null> {
  const result = await forward(`${CATALOG_URL()}/products/${id}`, {
    method: "GET",
    headers: internalHeaders(),
  });
  if (result.status !== 200) return null;
  const body = result.body as { id: string; unitPrice: number; categoryName: string };
  return { id: body.id, unitPrice: body.unitPrice, categoryName: body.categoryName };
}

async function resolveCoupon(code: string): Promise<ResolveCouponResult> {
  const result = await forward(`${COUPON_URL()}/internal/coupons/resolve`, {
    method: "POST",
    headers: internalHeaders(),
    body: { code },
  });
  return result.body as ResolveCouponResult;
}

async function calculate(input: unknown) {
  const result = await forward(`${DISCOUNT_URL()}/internal/discounts/calculate`, {
    method: "POST",
    headers: internalHeaders(),
    body: input,
  });
  return result.body as Record<string, unknown>;
}

@Controller()
export class CheckoutController {
  @Post("checkout/preview")
  async preview(@Body() body: PreviewRequest, @Res() res: Response) {
    const result = await buildPreview(body, { getProduct, resolveCoupon, calculate });
    if (!result.ok) {
      res.status(404).json({ message: "Producto no encontrado", productId: result.productId });
      return;
    }
    res.status(200).json({ orderId: null, ...result.breakdown });
  }

  @Post("checkout")
  async checkout(@Body() body: unknown, @Res() res: Response) {
    relay(res, await forward(`${ORDER_URL()}/checkout`, { method: "POST", headers: internalHeaders(), body }));
  }

  @Get("orders/:id")
  async getOrder(@Param("id") id: string, @Res() res: Response) {
    relay(res, await forward(`${ORDER_URL()}/${id}`, { method: "GET", headers: internalHeaders() }));
  }
}
