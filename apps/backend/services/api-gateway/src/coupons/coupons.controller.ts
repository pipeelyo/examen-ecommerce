import { Body, Controller, Get, Param, Patch, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AdminGuard } from "../common/admin.guard";
import { forward } from "../common/downstream";
import { adminHeaders, internalHeaders } from "../common/headers";

const COUPON_URL = () => process.env.COUPON_SERVICE_URL ?? "http://coupon-service:3003";

function relay(res: Response, result: { status: number; body: unknown }) {
  res.status(result.status).json(result.body);
}

@Controller("coupons")
export class CouponsController {
  @Get("available")
  async available(@Res() res: Response) {
    relay(res, await forward(`${COUPON_URL()}/available`, { method: "GET", headers: internalHeaders() }));
  }

  @Get(":code")
  async checkCode(@Param("code") code: string, @Res() res: Response) {
    relay(res, await forward(`${COUPON_URL()}/${code}`, { method: "GET", headers: internalHeaders() }));
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() body: unknown, @Res() res: Response) {
    relay(res, await forward(`${COUPON_URL()}/admin/coupons`, { method: "POST", headers: adminHeaders(), body }));
  }

  @Patch(":id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() body: unknown, @Res() res: Response) {
    relay(
      res,
      await forward(`${COUPON_URL()}/admin/coupons/${id}`, { method: "PATCH", headers: adminHeaders(), body }),
    );
  }
}
