import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { AdminGuard } from "../common/admin.guard";
import { forward } from "../common/downstream";
import { adminHeaders, internalHeaders } from "../common/headers";

const CATALOG_URL = () => process.env.CATALOG_SERVICE_URL ?? "http://catalog-service:3002";

function relay(res: Response, result: { status: number; body: unknown }) {
  res.status(result.status).json(result.body);
}

@Controller()
export class ProductsController {
  @Get("products")
  async list(@Res() res: Response) {
    relay(res, await forward(`${CATALOG_URL()}/products`, { method: "GET", headers: internalHeaders() }));
  }

  @Get("products/:id")
  async getById(@Param("id") id: string, @Res() res: Response) {
    relay(res, await forward(`${CATALOG_URL()}/products/${id}`, { method: "GET", headers: internalHeaders() }));
  }

  @Get("categories")
  async categories(@Res() res: Response) {
    relay(res, await forward(`${CATALOG_URL()}/categories`, { method: "GET", headers: internalHeaders() }));
  }

  @Post("products")
  @UseGuards(AdminGuard)
  async create(@Body() body: unknown, @Res() res: Response) {
    relay(
      res,
      await forward(`${CATALOG_URL()}/admin/products`, { method: "POST", headers: adminHeaders(), body }),
    );
  }

  @Patch("products/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() body: unknown, @Res() res: Response) {
    relay(
      res,
      await forward(`${CATALOG_URL()}/admin/products/${id}`, { method: "PATCH", headers: adminHeaders(), body }),
    );
  }

  @Patch("products/:id/stock")
  @UseGuards(AdminGuard)
  async adjustStock(@Param("id") id: string, @Body() body: unknown, @Res() res: Response) {
    relay(
      res,
      await forward(`${CATALOG_URL()}/admin/products/${id}/stock`, {
        method: "PATCH",
        headers: adminHeaders(),
        body,
      }),
    );
  }

  @Delete("products/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string, @Res() res: Response) {
    relay(
      res,
      await forward(`${CATALOG_URL()}/admin/products/${id}`, { method: "DELETE", headers: adminHeaders() }),
    );
  }
}
