import "jsr:@supabase/functions-js/edge-runtime.d";

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
      }
      throw new Error(`Horizon API error [${res.status}]: ${await res.text()}`);
    }

    const account = await res.json();
    const balances = account.balances || [];

    const xlmBalance =
      balances.find((b: any) => b.asset_type === "native")?.balance || "0";
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
    );
  }
}

if (import.meta.main) {
  Deno.serve((req) => handleRequest(req));
}
