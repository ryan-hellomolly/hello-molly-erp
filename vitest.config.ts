import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/test/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    sequence: { concurrent: false },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/server/auth/**/*.ts",
        "src/server/customers/**/*.ts",
        "src/server/suppliers/**/*.ts",
        "src/server/factories/**/*.ts",
        "src/server/warehouses/**/*.ts",
        "src/server/reference-data/**/*.ts",
        "src/server/templates/**/*.ts",
        "src/server/foundation-records/**/*.ts",
      ],
      exclude: ["src/server/**/*.test.ts", "src/server/auth/contracts.ts"],
      thresholds: {
        statements: 40,
        branches: 35,
        functions: 50,
        lines: 40,
      },
    },
  },
});
