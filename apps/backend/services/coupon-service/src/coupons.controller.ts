import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { CreateCouponInput, UpdateCouponInput } from "./coupons.repository";
import { CouponsService } from "./coupons.service";
import { InternalTokenGuard } from "./internal-token.guard";

@Controller()
export class CouponsController {
  constructor(
    @Inject(CouponsService)
    private readonly coupons: CouponsService,
  ) {}

  @Get("health")
  health() {
    return { status: "ok", service: "coupon-service" };
  }

  @Get("available")
  available() {
    return this.coupons.listAvailable();
  }

  @Get(":code")
  async checkCode(@Param("code") code: string) {
    const result = await this.coupons.resolve(code);
    if (!result.applied && result.reason === "NOT_FOUND") {
      throw new NotFoundException({ code: "NOT_FOUND", message: `Cupón ${code} no existe` });
    }
    return result;
  }

  @Post("internal/coupons/resolve")
  @UseGuards(InternalTokenGuard)
  resolve(@Body() body: { code: string }) {
    return this.coupons.resolve(body.code);
  }

  @Post("admin/coupons")
  @UseGuards(InternalTokenGuard)
  create(@Body() body: CreateCouponInput) {
    return this.coupons.create(body);
  }

  @Patch("admin/coupons/:id")
  @UseGuards(InternalTokenGuard)
  update(@Param("id") id: string, @Body() body: UpdateCouponInput) {
    return this.coupons.update(id, body);
  }
}
