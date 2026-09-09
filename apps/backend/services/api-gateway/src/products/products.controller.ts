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
import { toProductDto, type CatalogProductRecord } from "./product.mapper";

const CATALOG_URL = () => process.env.CATALOG_SERVICE_URL ?? "http://catalog-service:3002";

function mapCatalogBody(status: number, body: unknown): { status: number; body: unknown } {
  if (status >= 400) return { status, body };
  if (Array.isArray(body)) {
    return { status, body: (body as CatalogProductRecord[]).map(toProductDto) };
  }
  if (body && typeof body === "object" && "categoryName" in body && "unitPrice" in body) {
    return { status, body: toProductDto(body as CatalogProductRecord) };
  }
  return { status, body };
}

function send(res: Response, result: { status: number; body: unknown }) {
  const mapped = mapCatalogBody(result.status, result.body);
  res.status(mapped.status).json(mapped.body);
}

@Controller()
export class ProductsController {
  @Get("products")
  async list(@Res() res: Response) {
    const result = await forward(`${CATALOG_URL()}/products`, { method: "GET", headers: internalHeaders() });
    const mapped = mapCatalogBody(result.status, result.body);
    res.status(mapped.status).json(mapped.body);
  }

  @Get("products/:id")
  async getById(@Param("id") id: string, @Res() res: Response) {
    const result = await forward(`${CATALOG_URL()}/products/${id}`, { method: "GET", headers: internalHeaders() });
    const mapped = mapCatalogBody(result.status, result.body);
    res.status(mapped.status).json(mapped.body);
  }

  @Get("categories")
  async categories(@Res() res: Response) {
    const result = await forward(`${CATALOG_URL()}/categories`, { method: "GET", headers: internalHeaders() });
    res.status(result.status).json(result.body);
  }

  @Post("products")
  @UseGuards(AdminGuard)
  async create(@Body() body: unknown, @Res() res: Response) {
    send(res, await forward(`${CATALOG_URL()}/admin/products`, { method: "POST", headers: adminHeaders(), body }));
  }

  @Patch("products/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() body: unknown, @Res() res: Response) {
    send(
      res,
      await forward(`${CATALOG_URL()}/admin/products/${id}`, { method: "PATCH", headers: adminHeaders(), body }),
    );
  }

  @Patch("products/:id/stock")
  @UseGuards(AdminGuard)
  async adjustStock(@Param("id") id: string, @Body() body: unknown, @Res() res: Response) {
    send(
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
    send(res, await forward(`${CATALOG_URL()}/admin/products/${id}`, { method: "DELETE", headers: adminHeaders() }));
  }
}
