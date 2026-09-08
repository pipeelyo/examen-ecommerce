import type { PrismaService } from "../../src/prisma.service";
import type { ProductRecord } from "../../src/products/product.types";

export type MemCategory = { id: string; name: string };
export type MemProduct = {
  id: string;
  sku: string;
  name: string;
  unitPrice: number;
  categoryId: string;
  stock: number;
  active: boolean;
};

export class MemDb {
  categories = new Map<string, MemCategory>();
  products = new Map<string, MemProduct>();
  seq = 1;

  clone(): MemDb {
    const copy = new MemDb();
    copy.seq = this.seq;
    for (const [id, row] of this.categories) copy.categories.set(id, { ...row });
    for (const [id, row] of this.products) copy.products.set(id, { ...row });
    return copy;
  }

  restore(other: MemDb) {
    this.seq = other.seq;
    this.categories = other.categories;
    this.products = other.products;
  }

  addCategory(name: string): MemCategory {
    const row = { id: `cat-${this.seq++}`, name };
    this.categories.set(row.id, row);
    return row;
  }

  addProduct(partial: Omit<MemProduct, "id" | "active"> & { id?: string; active?: boolean }): MemProduct {
    const row: MemProduct = {
      id: partial.id ?? `prod-${this.seq++}`,
      sku: partial.sku,
      name: partial.name,
      unitPrice: partial.unitPrice,
      categoryId: partial.categoryId,
      stock: partial.stock,
      active: partial.active ?? true,
    };
    this.products.set(row.id, row);
    return row;
  }
}

type UpdateManyArgs = {
  where: { id: string; stock?: { gte: number } };
  data: { stock?: { increment?: number; decrement?: number }; active?: boolean };
};

function withCategory(db: MemDb, product: MemProduct) {
  const category = db.categories.get(product.categoryId);
  if (!category) {
    throw new Error("categoría huérfana");
  }
  return { ...product, unitPrice: { toNumber: () => product.unitPrice }, category };
}

export function createPrismaStub(db: MemDb): PrismaService {
  let txLock: Promise<void> = Promise.resolve();

  const client = {
    category: {
      findMany: async () => [...db.categories.values()].sort((a, b) => a.name.localeCompare(b.name)),
    },
    product: {
      findMany: async (args?: { where?: { active?: boolean } }) => {
        let rows = [...db.products.values()];
        if (args?.where?.active !== undefined) {
          rows = rows.filter((row) => row.active === args.where?.active);
        }
        rows.sort((a, b) => a.name.localeCompare(b.name));
        return rows.map((row) => withCategory(db, row));
      },
      findUnique: async (args: { where: { id: string } }) => {
        const row = db.products.get(args.where.id);
        return row ? withCategory(db, row) : null;
      },
      findUniqueOrThrow: async (args: { where: { id: string } }) => {
        const row = db.products.get(args.where.id);
        if (!row) {
          throw new Error("not found");
        }
        return withCategory(db, row);
      },
      create: async (args: {
        data: {
          sku: string;
          name: string;
          unitPrice: number;
          categoryId: string;
          stock: number;
        };
      }) => {
        const row = db.addProduct(args.data);
        return withCategory(db, row);
      },
      update: async (args: {
        where: { id: string };
        data: Partial<Pick<MemProduct, "name" | "unitPrice" | "categoryId" | "active">>;
      }) => {
        const row = db.products.get(args.where.id);
        if (!row) {
          throw new Error("not found");
        }
        for (const [key, value] of Object.entries(args.data)) {
          if (value !== undefined) {
            Object.assign(row, { [key]: value });
          }
        }
        return withCategory(db, row);
      },
      updateMany: async (args: UpdateManyArgs) => {
        const row = db.products.get(args.where.id);
        if (!row) {
          return { count: 0 };
        }
        if (args.where.stock && row.stock < args.where.stock.gte) {
          return { count: 0 };
        }
        if (args.data.stock?.increment) {
          row.stock += args.data.stock.increment;
        }
        if (args.data.stock?.decrement) {
          row.stock -= args.data.stock.decrement;
        }
        if (args.data.active !== undefined) {
          row.active = args.data.active;
        }
        return { count: 1 };
      },
    },
    $transaction: async <T>(fn: (tx: typeof client) => Promise<T>): Promise<T> => {
      const run = txLock.then(async () => {
        const snapshot = db.clone();
        try {
          return await fn(client);
        } catch (error) {
          db.restore(snapshot);
          throw error;
        }
      });
      txLock = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  };

  return client as unknown as PrismaService;
}

export function asPublic(row: ProductRecord): Pick<ProductRecord, "id" | "stock" | "active" | "name"> {
  return { id: row.id, stock: row.stock, active: row.active, name: row.name };
}
