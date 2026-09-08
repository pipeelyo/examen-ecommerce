import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.coupon.upsert({
    where: { code: "WELCOME2026" },
    update: {},
    create: {
      code: "WELCOME2026",
      label: "15% en toda la compra",
      scope: "GLOBAL",
      discountPercent: 15,
      active: true,
      validFrom: new Date("2026-01-01"),
      validTo: new Date("2027-01-01"),
    },
  });

  await prisma.coupon.upsert({
    where: { code: "TECH30" },
    update: {},
    create: {
      code: "TECH30",
      label: "30% en Tecnologia",
      scope: "CATEGORY",
      categoryName: "Tecnologia",
      discountPercent: 30,
      active: true,
      validFrom: new Date("2026-01-01"),
      validTo: new Date("2027-01-01"),
    },
  });

  await prisma.coupon.upsert({
    where: { code: "JUGUETES10" },
    update: {},
    create: {
      code: "JUGUETES10",
      label: "10% en Jugueteria",
      scope: "CATEGORY",
      categoryName: "Jugueteria",
      discountPercent: 10,
      active: true,
      validFrom: new Date("2026-01-01"),
      validTo: new Date("2027-01-01"),
    },
  });

  await prisma.coupon.upsert({
    where: { code: "EXPIRED2025" },
    update: {},
    create: {
      code: "EXPIRED2025",
      label: "Cupon vencido (edge case de prueba)",
      scope: "GLOBAL",
      discountPercent: 20,
      active: true,
      validFrom: new Date("2025-01-01"),
      validTo: new Date("2025-12-31"),
    },
  });

  await prisma.coupon.upsert({
    where: { code: "INACTIVE2026" },
    update: {},
    create: {
      code: "INACTIVE2026",
      label: "Cupon inactivo (edge case de prueba)",
      scope: "GLOBAL",
      discountPercent: 10,
      active: false,
      validFrom: new Date("2026-01-01"),
      validTo: new Date("2027-01-01"),
    },
  });

  await prisma.coupon.upsert({
    where: { code: "FUTURE2027" },
    update: {},
    create: {
      code: "FUTURE2027",
      label: "Cupon aun no vigente (edge case de prueba)",
      scope: "GLOBAL",
      discountPercent: 25,
      active: true,
      validFrom: new Date("2027-06-01"),
      validTo: new Date("2028-01-01"),
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
