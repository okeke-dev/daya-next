import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // The `server-only` guard package throws when imported outside of a
      // Server-Component bundler. Next.js rewrites it during builds; in the
      // test environment we satisfy the import with a no-op module.
      "server-only": fileURLToPath(new URL("./tests/helpers/server-only.ts", import.meta.url)),
      // `next/cache` is unavailable outside a Next application; the test
      // environment substitutes a cache with the same memoize-by-arguments
      // semantics (see tests/helpers/request-cache.ts).
      "next/cache": fileURLToPath(new URL("./tests/helpers/request-cache.ts", import.meta.url)),
    },
  },
  test: {
    globals: false,
    include: ["tests/**/*.test.ts"],
    pool: "forks",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/types/**"],
      reporter: ["text", "lcov"],
    },
  },
});
