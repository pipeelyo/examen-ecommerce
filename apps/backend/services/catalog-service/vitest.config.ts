import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/main.ts",
        "src/catalog.module.ts",
        "src/health.controller.ts",
        "src/prisma.service.ts",
        "src/products/products.controller.ts",
        "src/products/dto/**",
        "src/stock/stock.controller.ts",
        "src/stock/dto/**",
        "src/categories/categories.controller.ts",
        "src/common/internal-token.guard.ts",
        "src/common/roles.guard.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
