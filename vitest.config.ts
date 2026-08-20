import { defineConfig } from "vitest/config";

// Dedicated test config so Vitest does NOT load the app's TanStack Start / Nitro
// Vite plugins (which keep a dev server alive and hang the process on exit).
// Tests target pure, dependency-free modules only.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "extension/**/*.test.ts"],
    watch: false,
  },
});
