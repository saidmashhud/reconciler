import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "reconciler",
  },
  resolve: {
    alias: {
      "reconciler/jsx-runtime": new URL("./src/jsx-runtime.ts", import.meta.url)
        .pathname,
      "reconciler/jsx-dev-runtime": new URL(
        "./src/jsx-dev-runtime.ts",
        import.meta.url,
      ).pathname,
      reconciler: new URL("./src/index.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: false,
  },
});
