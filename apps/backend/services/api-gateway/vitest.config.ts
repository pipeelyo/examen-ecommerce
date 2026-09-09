import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/main.ts",
        "src/app.module.ts",
        "src/health.controller.ts",
        "src/common/downstream.ts",
        "src/checkout/checkout.controller.ts",
        "src/checkout/dto/checkout-request.dto.ts",
        "src/products/products.controller.ts",
        "src/coupons/coupons.controller.ts",
        "src/status/status.controller.ts",
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
