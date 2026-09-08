import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { CreateCouponInput, UpdateCouponInput } from "./coupons.repository";
import { CouponsService } from "./coupons.service";
import { InternalTokenGuard } from "./internal-token.guard";

@Controller()
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get("available")
  available() {
    return this.coupons.listAvailable();
  }

  @Get(":code")
  checkCode(@Param("code") code: string) {
    return this.coupons.resolve(code);
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
