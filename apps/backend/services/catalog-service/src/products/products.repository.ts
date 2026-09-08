import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InsufficientStockException } from "../common/insufficient-stock.exception";
import { PrismaService } from "../prisma.service";
import {
  UUID_RE,
  type CreateProductInput,
  type ProductRecord,
  type StockItemInput,
  type UpdateProductInput,
} from "./product.types";

function toRecord(row: {
  id: string;
  sku: string;
  name: string;
  unitPrice: { toNumber(): number } | number | string;
  categoryId: string;
  category: { name: string };
  stock: number;
  active: boolean;
}): ProductRecord {
  const unitPrice =
    typeof row.unitPrice === "number"
      ? row.unitPrice
      : typeof row.unitPrice === "string"
        ? Number(row.unitPrice)
        : row.unitPrice.toNumber();
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    unitPrice,
    categoryId: row.categoryId,
    categoryName: row.category.name,
    stock: row.stock,
    active: row.active,
  };
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(): Promise<ProductRecord[]> {
    const rows = await this.prisma.product.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { name: "asc" },
    });
    return rows.map(toRecord);
  }

  async listCategories(): Promise<Array<{ id: string; name: string }>> {
    return this.prisma.category.findMany({ orderBy: { name: "asc" } });
  }

  async findById(id: string): Promise<ProductRecord | null> {
    const row = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    return row ? toRecord(row) : null;
  }

  async create(input: CreateProductInput): Promise<ProductRecord> {
    const row = await this.prisma.product.create({
      data: {
        sku: input.sku,
        name: input.name,
        unitPrice: input.unitPrice,
        categoryId: input.categoryId,
        stock: input.stock,
      },
      include: { category: true },
    });
    return toRecord(row);
  }

  async update(id: string, input: UpdateProductInput): Promise<ProductRecord> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Producto ${id} no existe`);
    }
    const row = await this.prisma.product.update({
      where: { id },
      data: {
        name: input.name,
        unitPrice: input.unitPrice,
        categoryId: input.categoryId,
      },
      include: { category: true },
    });
    return toRecord(row);
  }

  async softDelete(id: string): Promise<ProductRecord> {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existing) {
      throw new NotFoundException(`Producto ${id} no existe`);
    }
    const row = await this.prisma.product.update({
      where: { id },
      data: { active: false },
      include: { category: true },
    });
    return toRecord(row);
  }

  async adjustStock(id: string, delta: number): Promise<ProductRecord> {
    if (!Number.isInteger(delta) || delta === 0) {
      throw new BadRequestException("delta debe ser un entero distinto de 0");
    }
    if (delta > 0) {
      const updated = await this.prisma.product.updateMany({
        where: { id },
        data: { stock: { increment: delta } },
      });
      if (updated.count === 0) {
        throw new NotFoundException(`Producto ${id} no existe`);
      }
    } else {
      const updated = await this.prisma.product.updateMany({
        where: { id, stock: { gte: Math.abs(delta) } },
        data: { stock: { decrement: Math.abs(delta) } },
      });
      if (updated.count === 0) {
        const exists = await this.prisma.product.findUnique({ where: { id } });
        if (!exists) {
          throw new NotFoundException(`Producto ${id} no existe`);
        }
        throw new BadRequestException(
          "El ajuste dejaría el stock en negativo",
        );
      }
    }
    const row = await this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: { category: true },
    });
    return toRecord(row);
  }

  async reserveStock(items: StockItemInput[]): Promise<ProductRecord[]> {
    this.assertItems(items);
    return this.prisma.$transaction(async (tx) => {
      const reserved: ProductRecord[] = [];
      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new InsufficientStockException(item.productId);
        }
        const row = await tx.product.findUniqueOrThrow({
          where: { id: item.productId },
          include: { category: true },
        });
        reserved.push(toRecord(row));
      }
      return reserved;
    });
  }

  async releaseStock(items: StockItemInput[]): Promise<ProductRecord[]> {
    this.assertItems(items);
    return this.prisma.$transaction(async (tx) => {
      const released: ProductRecord[] = [];
      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        if (updated.count === 0) {
          throw new NotFoundException(`Producto ${item.productId} no existe`);
        }
        const row = await tx.product.findUniqueOrThrow({
          where: { id: item.productId },
          include: { category: true },
        });
        released.push(toRecord(row));
      }
      return released;
    });
  }

  private assertItems(items: StockItemInput[]): void {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException("items es obligatorio");
    }
    for (const item of items) {
      if (!UUID_RE.test(item.productId)) {
        throw new BadRequestException("productId debe ser un UUID");
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new BadRequestException("quantity debe ser un entero >= 1");
      }
    }
  }
}
