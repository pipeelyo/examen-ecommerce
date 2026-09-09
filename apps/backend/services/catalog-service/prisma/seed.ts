import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tecnologia = await prisma.category.upsert({
    where: { name: "Tecnologia" },
    update: {},
    create: { name: "Tecnologia" },
  });
  await prisma.category.upsert({
    where: { name: "Jugueteria" },
    update: {},
    create: { name: "Jugueteria" },
  });
  await prisma.category.upsert({
    where: { name: "Hogar" },
    update: {},
    create: { name: "Hogar" },
  });
  const libros = await prisma.category.upsert({
    where: { name: "Libros" },
    update: {},
    create: { name: "Libros" },
  });
  const muebles = await prisma.category.upsert({
    where: { name: "Muebles" },
    update: {},
    create: { name: "Muebles" },
  });

  // Solo los 4 SKUs del CONTRACT.md del front. Los UUID de prueba
  // (LAPTOP-14, PHONE-X, …) se desactivan para no duplicar el catálogo.
  await prisma.product.updateMany({
    where: { id: { notIn: ["p-laptop", "p-mouse", "p-libro", "p-silla"] } },
    data: { active: false },
  });

  const contractProducts: Array<{
    id: string;
    sku: string;
    name: string;
    unitPrice: number;
    categoryId: string;
    stock: number;
  }> = [
    { id: "p-laptop", sku: "CONTRACT-LAPTOP", name: "Laptop", unitPrice: 700, categoryId: tecnologia.id, stock: 10 },
    { id: "p-mouse", sku: "CONTRACT-MOUSE", name: "Mouse", unitPrice: 50, categoryId: tecnologia.id, stock: 20 },
    { id: "p-libro", sku: "CONTRACT-LIBRO", name: "Libro", unitPrice: 30, categoryId: libros.id, stock: 15 },
    { id: "p-silla", sku: "CONTRACT-SILLA", name: "Silla", unitPrice: 349, categoryId: muebles.id, stock: 0 },
  ];

  for (const product of contractProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        unitPrice: product.unitPrice,
        categoryId: product.categoryId,
        stock: product.stock,
        active: true,
      },
      create: product,
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
