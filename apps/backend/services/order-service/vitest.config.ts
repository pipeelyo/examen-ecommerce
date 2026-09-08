import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/main.ts",
        "src/orders/orders.controller.ts",
        "src/orders/orders.module.ts",
        "src/orders/orders.service.ts",
        "src/orders/orders.repository.ts",
        "src/orders/dto/**",
        "src/clients/http-*.ts",
        "src/clients/catalog.client.ts",
        "src/clients/coupon.client.ts",
        "src/clients/discount.client.ts",
        "src/common/internal-token.guard.ts",
        "src/health.controller.ts",
        "src/outbox/redis-publisher.ts",
      ],
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
});
