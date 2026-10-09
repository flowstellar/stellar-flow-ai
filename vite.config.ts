import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const REQUIRED_PROD_ENV_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

function assertProdEnv() {
  const env = loadEnv();
  const missing = REQUIRED_PROD_ENV_VARS.filter((key) => {
    const value = env[key] ?? process.env[key];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(
       `Missing required build environment variable(s): ${missing.join(", ")}. ` +
         `Set them in your environment or .env file before building.`,
    );
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === "production") {
    assertProdEnv();
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@radix-ui/react-tooltip",
        "@radix-ui/react-dialog",
        "@radix-ui/react-toast",
        "framer-motion",
      ],
    },
  };
});
