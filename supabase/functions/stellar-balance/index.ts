import "jsr:@supabase/functions-js/edge-runtime.d";
import "jsr:@supabase/functions-js/edge-runtime.dts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? (() => Date.now());

  try {
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
