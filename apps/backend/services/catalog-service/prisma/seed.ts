import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tecnologia = await prisma.category.upsert({
    where: { name: "Tecnologia" },
    update: {},
    create: { name: "Tecnologia" },
  });
  const jugueteria = await prisma.category.upsert({
    where: { name: "Jugueteria" },
    update: {},
    create: { name: "Jugueteria" },
  });
  const hogar = await prisma.category.upsert({
    where: { name: "Hogar" },
    update: {},
    create: { name: "Hogar" },
  });
  const libros = await prisma.category.upsert({
    where: { name: "Libros" },
    update: {},
    create: { name: "Libros" },
  });

  const products: Array<{
    sku: string;
    name: string;
    unitPrice: number;
    categoryId: string;
    stock: number;
  }> = [
    { sku: "LAPTOP-14", name: "Laptop", unitPrice: 700, categoryId: tecnologia.id, stock: 10 },
    { sku: "PHONE-X", name: "Smartphone", unitPrice: 500, categoryId: tecnologia.id, stock: 15 },
    { sku: "HEAD-80", name: "Auriculares", unitPrice: 80, categoryId: tecnologia.id, stock: 40 },
    { sku: "MOUSE-50", name: "Mouse", unitPrice: 50, categoryId: tecnologia.id, stock: 50 },
    { sku: "LEGO-40", name: "Lego Classic", unitPrice: 40, categoryId: jugueteria.id, stock: 20 },
    { sku: "PLUSH-25", name: "Peluche", unitPrice: 25, categoryId: jugueteria.id, stock: 25 },
    { sku: "LAMP-35", name: "Lampara de mesa", unitPrice: 35, categoryId: hogar.id, stock: 12 },
    { sku: "SHEET-45", name: "Juego de sabanas", unitPrice: 45, categoryId: hogar.id, stock: 8 },
    { sku: "BOOK-CA", name: "Clean Architecture", unitPrice: 42, categoryId: libros.id, stock: 30 },
    { sku: "BOOK-DDD", name: "Domain Driven Design", unitPrice: 55, categoryId: libros.id, stock: 18 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
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
