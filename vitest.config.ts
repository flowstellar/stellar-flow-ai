import { defineConfig } from "viticonfig/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://localhost/" } },
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".stryker-tmp"],
    css: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
