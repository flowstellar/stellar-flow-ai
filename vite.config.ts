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
aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAidml0ZSI7CmltcG9ydCByZWFjdCBmcm9tICJA dml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MiOwppbXBvcnQgcGF0aCBmcm9tICJwYXRoIjsKaW1wb3J0 IHsgbG92YWJsZS10YWdnZXIgfSBmcm9tICJsb3ZhYmxlLXRhZ2dlciI7CgovLyBodHRwczovL3Zp dGVqcy5kZXYvY29uZmlnLwpleHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9 KSA9PiAoewogIHNlcnZlcjogewogICAgaG9zdDogIjo6IiwKICAgIHBvcnQ6IDgwODAsCiAg ICBobXI6IHsKICAgICAgb3ZlcmxheTogZmFsc2UsCiAgICB9LAogIH0sCiAgcGx1Z2luczog W3JlYWN0KCksIG1vZGUgPT09ICJkZXZlbG9wbWVudCIgJiYgY29tcG9uZW50VGFnZ2VyKCld LmZpbHRlcihCb29sZWFuKSwKICByZXNvbHZlOiB7CiAgICBhbGlhczogewogICAgICAiQCI6 IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICIuL3NyYyIpLAogICAgfSwKICAgIGRlZHVwZTog WyJyZWFjdCIsICJyZWFjdC1kb20iLCAicmVhY3QvanN4LXJ1bnRpbWUiLCAicmVhY3QvanN4 LWRldi1ydW50aW1lIl0sCiAgfSwKICBvcHRpbWl6ZURlcHM6IHsKICAgIGluY2x1ZGU6IFsK ICAgICAgInJlYWN0IiwKICAgICAgInJlYWN0LWRvbSIsCiAgICAgICJyZWFjdC9qc3gtcnVudGlt ZSIsCiAgICAgICJyZWFjdC9qc3gtZGV2LXJ1bnRpbWUiLAogICAgICAiQHJhZGl4LXVpL3JlYWN0 LXRvb2x0aXAiLAogICAgICAiQHJhZGl4LXVpL3JlYWN0LWRpYWxvZyIsCiAgICAgICJAcmFkaXgt dWkvcmVhY3QtdG9hc3QiLAogICAgICAiZnJhbWVyLW1vdGlvbiIsCiAgICBdLAogIH0sCn0p KTsK