import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "**/node_modules/**",
        "src/index.ts",
      ],
      /** 当前以「拦住明显退步」为主；后续补测后可逐步提高 */
      thresholds: {
        lines: 76,
        statements: 76,
        functions: 90,
        branches: 62,
      },
    },
  },
});
