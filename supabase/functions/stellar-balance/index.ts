import "jsr:@supabase/functions-js/edge-runtime.d";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import "jsr:@supabase/functions-js/edge-runtime.dts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
import "jsr:@supabase/functions-js/edge-runtime.dts";
import { corsHeaders, requireAuth, isAuthResult } from "../_shared/auth.ts";
import "jsr:@supabase/functions-js/edge-runtime.dts";
import { buildCorsHeaders, handlePreflight } from "../_shared/cors.ts";

const HORIZON_URL = "https://horizon-testnet.stellar.org";

// Public XLM/USD price endpoint (CoinGecko simple price API).
const PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd":
// Short in-memory cache to avoid hitting the price API on every request.
const PRICE_CACHE_TTL_MS = 60_000; // 1 minute

// Documented fallback: if the price lookup fails, we return `null` for the
// rate and `null` for `usdValue`, along with `rateUnavailable: true` so the
// client can render an explicit "unknown" state instead of a stale constant.

let cachedRate: number | null = null;
let cachedAt = 0;

export interface PriceResult {
  rate: number | null;
  timestamp: string;
  source: string;
  error?: string;
}

export async function fetchXlmUsdRate(
  fetchImpl: typeof fetch = fetch,
  now: () => number = () => Date.now(),
): Promise<PriceResult> {
  const nowMs = now();
  if (cachedRate !== null && nowMs - cachedAt < PRICE_CACHE_TTL_MS) {
    return {
      rate: cachedRate,
      timestamp: new Date(cachedAt).toISOString(),
      source: "coingecko",
    };
  }

  try {
    const res = await fetchImpl(PRICE_URL, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Price API error [${res.status}]`);
    }
    const data = await res.json();
    const rate = data?.stellar?.usd;
    if (typeof rate !== "number" || !Number.finite(rate) || rate <= 0) {
      throw new Error("Invalid rate payload from price API");
    }
    cachedRate = rate;
    cachedAt = nowMs;
    return {
      rate,
      timestamp: new Date(nowMs).toISOString(),
      source: "coingecko",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // If we have a stale cached rate, prefer to surface it with its timestamp
    // rather than failing completely.
    if (cachedRate !== null) {
      return {
        rate: cachedRate,
        timestamp: new Date(cachedAt).toISOString(),
        source: "coingecko",
        error: message,
      };
    }
    return {
      rate: null,
      timestamp: new Date(nowMs).toISOString(),
      source: "coingecko",
      error: message,
    };
  }
}

export function __resetPriceCache() {
  cachedRate = null;
  cachedAt = 0;
}

function buildResponse(body: Record<unknown, unknown>, status = 200) {
const XLM_USD_PRICE = 0.5;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function handleRequest(
  req: Request,
  deps: {
    fetchImpl?: typeof fetch;
    now?: () => number;
  } = {},
): Promise<Response> {
export const handler = async (req: Request): Promise<Response> => {
interface HorizonBalance {
  asset_type: string;
  balance: string;
  [key: string]: unknown;
}

interface HorizonAccount {
  sequence: string;
  balances?: HorizonBalance[];
// --- Rate limiting ---
// Per-caller fixed-window throttle. The edge runtime is single-isolate per hot
// instance, so an in-memory map is enough to stop a curl loop from draining the
// account. Expired entries are swept on each call so the map cannot grow
// unbounded.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_MAP_MAX = 10_000;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function clientIdentity(req: Request): string {
  const auth = req.headers.get("authorization");
  if (auth) {
    // Hash the token so the raw credential is never kept in memory.
    return `auth:${hashString(auth)}`;
  }
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return `ip:${forwarded.split(",")[0].trim()}`;
  }
  return "anon:unknown";
}

function hashString(value: string): string {
  // FNV-1 -> 32-bit int -> unsigned hex. Cheap and sufficient for bucketing.
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function sweepRateLimitMap(now: number) {
  if (rateLimitMap.size < RATE_LIMIT_MAP_MAX) return;
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }
}

function checkRateLimit(clientId: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  sweepRateLimitMap(now);
  const existing = rateLimitMap.get(clientId);
  if (!existing || now - existing.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(clientId, { count: 1, windowStart: now });
    return { allowed: true, retryAfter: 0 };
  }
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil(
      (existing.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000
    );
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  }
  existing.count += 1;
  return { allowed: true, retryAfter: 0 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handlePreflight(req);
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? (() => Date.now());
  const corsHeaders = buildCorsHeaders(req);

  try {
    const auth = await requireAuth(req);
    if (!isAuthResult(auth)) {
      return auth;
    const clientId = clientIdentity(req);
    const rate = checkRateLimit(clientId);
    if (!rate.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate limit exceeded. Please retry later.",
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rate.retryAfter),
          },
        }
      );
    }

    const { publicKey } = await req.json();

    if (!publicKey) {
      return buildResponse(
        { success: false, error: "publicKey is required" },
        400,
      return new Response(
        JSON.stringify({ success: false, error: "publicKey is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const publicKey = typeof body?.publicKey === "string" ? body.publicKey.trim() : "";

    if (!publicKey) {
      return jsonResponse(
        { success: false, error: "publicKey is required" },
        400,
      );
    }

    // Fetch the real XLM/USD rate (non-blocking failure).
    const price = await fetchXlmUsdRate(fetchImpl, now);

    // Fetch account from Horizon
    const res = await fetchImpl(`${HORIZON_URL}/accounts/${publicKey}`);

    if (!res.ok) {
      if (res.status === 404) {
        const zeroUsd = price.rate !== null ? "$0.00" : null;
        return buildResponse({
    const res = await fetch(
      `${HORIZON_URL}/accounts/${encodeURIComponent(publicKey)}`,
    );

    if (!res.ok) {
      if (res.status === 404) {
        return jsonResponse({
          success: true,
          funded: false,
          balances: [{ asset_type: "native", balance: "0" }],
          xlmBalance: "0.00",
          usdValue: zeroUsd,
          rate: price.rate,
          rateTimestamp: price.timestamp,
          rateSource: price.source,
          rateUnavailable: price.rate === null,
        });
        return new Response(
          JSON.stringify({
            success: true,
            funded: false,
            balances: [{ asset_type: "native", balance: "0" }],
            xlmBalance: "0",
            usdValue: "$0.00",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
          usdValue: "$0.00",
        });
      }
      throw new Error(`Horizon API error [${res.status}]: ${await res.text()}`);
    }

    const account = (await res.json()) as HorizonAccount;
    const balances = account.balances || [];

    const xlmBalance =
      balances.find((b) => b.asset_type === "native")?.balance || "0";
    const xlmNum = parseFloat(xlmBalance);

    const usdValue =
      price.rate !== null
        ? `$${(xlmNum * price.rate).toFixed(2)}`
        : null;

    return buildResponse({
      success: true,
      funded: true,
      balances,
      xlmBalance: xlmNum.toFixed(2),
      usdValue,
      rate: price.rate,
      rateTimestamp: price.timestamp,
      rateSource: price.source,
      rateUnavailable: price.rate === null,
      sequence: account.sequence,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return buildResponse(
      { success: false, error: message },
      500,
    // Mock XLM price ~$0.50
    const usdValue = `$${(xlmNum * 0.5).toFixed(2)}`;

    return new Response(
      JSON.stringify({
        success: true,
        funded: true,
        balances,
        xlmBalance: xlmNum.toFixed(2),
        usdValue,
        sequence: account.sequence,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
    const account = await res.json();
    const balances = Array.isArray(account.balances) ? account.balances : [];

    const native = balances.find(
      (b: { asset_type?: string }) => b.asset_type === "native",
    ) as { balance?: string } | undefined;
    const xlmBalance = native?.balance ?? "0";
    const xlmNum = Number.parseFloat(xlmBalance);
    const usdValue = `$${(xlmNum * XLM_USD_PRICE).toFixed(2)}`;

    return jsonResponse({
      success: true,
      funded: true,
      balances,
      xlmBalance: xlmNum.toFixed(2),
      usdValue,
      sequence: account.sequence,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ success: false, error: message }, 500);
  }
}

if (import.meta.main) {
  Deno.serve((req) => handleRequest(req));
}
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { assertEquals, assertMatch } from "jsr:@std/assert@1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HORIZON_URL = "https://horizon-testnet.stellar.org";

type Handler = (req: Request) => Promise<Response>;

async function loadHandler(): Promise<Handler> {
  const mod = await import("./index.ts");
  return (mod as unknown as { default?: Handler }).default ??
    (mod as unknown as Handler);
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/stellar-balance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.test("stellar-balance: OPTIONS returns CORS headers", async () => {
  const handler = await loadHandler();
  const res = await handler(
    new Request("http://localhost/stellar-balance", { method: "OPTIONS" }),
  );
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("stellar-balance: missing publicKey returns 400", async () => {
  const handler = await loadHandler();
  const res = await handler(makeRequest({}));
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "publicKey is required");
});

Deno.test("stellar-balance: 404 from Horizon returns funded=false", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response("not found", { status: 404 }),
    )) as typeof fetch;
  try {
    const handler = await loadHandler();
    const res = await handler(makeRequest({ publicKey: "GABC" }));
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.success, true);
    assertEquals(body.funded, false);
    assertEquals(body.xlmBalance, "0");
    assertEquals(body.usdValue, "$0.00");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("stellar-balance: funded account returns balances", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          balances: [{ asset_type: "native", balance: "100.0000000" }],
          sequence: "12345",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )) as typeof fetch;
  try {
    const handler = await loadHandler();
    const res = await handler(makeRequest({ publicKey: "GABC" }));
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.success, true);
    assertEquals(body.funded, true);
    assertEquals(body.xlmBalance, "100.00");
    assertEquals(body.usdValue, "$50.00");
    assertEquals(body.sequence, "12345");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("stellar-balance: Horizon 500 returns 500", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response("boom", { status: 500 }),
    )) as typeof fetch;
  try {
    const handler = await loadHandler();
    const res = await handler(makeRequest({ publicKey: "GABC" }));
    assertEquals(res.status, 500);
    const body = await res.json();
    assertEquals(body.success, false);
    assertMatch(body.error, /Horizon API error \[500\]/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
};

if (import.meta.main) {
  Deno.serve(handler);
}
