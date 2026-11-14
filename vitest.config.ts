import { defineConfig } from "vitest/config";
import path from "node:path";

const testDb = process.env.DATABASE_URL_TEST ?? "postgresql://app:app@localhost:5432/amigo_test";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["src/**/*.test.ts"],
    fileParallelism: false,
    globalSetup: ["./vitest.setup.ts"],
    env: { DATABASE_URL: testDb },
  },
});
