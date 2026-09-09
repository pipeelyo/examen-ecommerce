import { Body, Controller, Get, Param, Post, Res, UnprocessableEntityException, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { BearerAuthGuard } from "../common/bearer-auth.guard";
import { forward } from "../common/downstream";
import { internalHeaders } from "../common/headers";
import { convertBreakdownToDollars, type CheckoutBreakdownCents } from "../common/money";
import { CheckoutRequestDto } from "./dto/checkout-request.dto";
import { mapOrderServiceError } from "./order-error.mapper";
import { buildPreview, type ProductLookup, type ResolveCouponResult } from "./preview.orchestrator";

const CATALOG_URL = () => process.env.CATALOG_SERVICE_URL ?? "http://catalog-service:3002";
const COUPON_URL = () => process.env.COUPON_SERVICE_URL ?? "http://coupon-service:3003";
const DISCOUNT_URL = () => process.env.DISCOUNT_SERVICE_URL ?? "http://discount-service:3001";
const ORDER_URL = () => process.env.ORDER_SERVICE_URL ?? "http://order-service:3004";

function assertCartNotEmpty(body: CheckoutRequestDto): void {
  if (!body.items || body.items.length === 0) {
    throw new UnprocessableEntityException({ code: "CART_EMPTY", message: "El carrito está vacío" });
  }
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

function toPublicOrder(body: unknown) {
  const record = (body ?? {}) as Record<string, unknown>;
  const normalized = {
    ...record,
    orderId: record.orderId ?? record.id ?? null,
  };
  return convertBreakdownToDollars(normalized as CheckoutBreakdownCents);
}

@Controller()
export class CheckoutController {
  @Post("checkout/preview")
  async preview(@Body() body: CheckoutRequestDto, @Res() res: Response) {
    assertCartNotEmpty(body);
    const result = await buildPreview(body, { getProduct, resolveCoupon, calculate });
    if (!result.ok) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "Producto no encontrado",
        details: { productId: result.productId },
      });
      return;
    }
    res.status(200).json({
      orderId: null,
      ...convertBreakdownToDollars(result.breakdown as unknown as CheckoutBreakdownCents),
    });
  }

  @Post("checkout")
  @UseGuards(BearerAuthGuard)
  async checkout(@Body() body: CheckoutRequestDto, @Res() res: Response) {
    assertCartNotEmpty(body);
    const { status, body: respBody } = await forward(`${ORDER_URL()}/checkout`, {
      method: "POST",
      headers: internalHeaders(),
      body,
    });
    if (status >= 400) {
      res.status(status).json(mapOrderServiceError(status, respBody));
      return;
    }
    res.status(status).json(toPublicOrder(respBody));
  }

  @Get("orders/:id")
  @UseGuards(BearerAuthGuard)
  async getOrder(@Param("id") id: string, @Res() res: Response) {
    const { status, body } = await forward(`${ORDER_URL()}/${id}`, { method: "GET", headers: internalHeaders() });
    if (status >= 400) {
      res.status(status).json(mapOrderServiceError(status, body));
      return;
    }
    res.status(status).json(toPublicOrder(body));
  }
}
