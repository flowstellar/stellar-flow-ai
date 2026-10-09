import "jsr:@supabase/functions-js/edge-runtime.dts";

/**
 * CORS allow-list for the Stellar edge functions.
 *
 * The allow-list is read from the `ALLOWED_ORIGINS` env var
 (comma-separated). When the variable is unset or empty, the
 documented default is used.
 *
 * Documented default:
 *   - http://localhost:8080  (the origin vite.config.ts binds)
 *   - https://stellar-signer.vercel.app (the deployed site)
 *
 * Preview deployments can be added without a code change by
 * setting the `ALLOWED_ORIGINS` env var, e.g.:
 *   ALLOWED_ORIGINS=https://stellar-signer.vercel.app,https://preview-1.example.com
 */

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "https://stellar-signer.vercel.app",
];

export function getAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS");
  if (!raw || raw.trim().length === 0) {
    return [...DEFAULT_ALLOWED_ORIGINS];
  }
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

/**
 * Build CORS headers for a given request.
 *
 * The `Access-Control-Allow-Origin` header is echoed back only
 * when the request `Origin` is in the allow-list. Otherwise the
 * permissive headers are omitted entirely.
 */
export function buildCorsHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };

  const origin = req.headers.get("origin");
  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin as string;
  }

  return headers;
}

/**
 * Handle an OPTIONS preflight request.
 *
 * Returns a 204 response with the appropriate CORS headers when
 * the origin is allowed, and a 403 response with no permissive
 * CORS headers when it is not.
 */
export function handlePreflight(req: Request): Response {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(req),
  });
}
