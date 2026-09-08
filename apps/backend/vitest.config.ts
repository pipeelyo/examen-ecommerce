import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/checkout.service.ts", "src/catalog.ts", "src/orders.store.ts"],
    },
  },
});
