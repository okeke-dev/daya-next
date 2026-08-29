import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    server: "src/server/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  target: "node18",
  splitting: false,
  minify: false,
  external: ["@okeke-dev/daya-sdk", "server-only", "next", "react", "react-dom"],
});
