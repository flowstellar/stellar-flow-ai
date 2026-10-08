import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import "jsr:@supabase/functions-js/edge-runtime.dts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HORIZON_URL = "https://horizon-testnet.stellar.org";

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
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      return new Response(
        JSON.stringify({ success: false, error: "publicKey is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch account from Horizon
    const res = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);

    if (!res.ok) {
      if (res.status === 404) {
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
          }
        );
      }
      throw new Error(`Horizon API error [${res.status}]: ${await res.text()}`);
    }

    const account = await res.json();
    const balances = account.balances || [];

    const xlmBalance =
      balances.find((b: any) => b.asset_type === "native")?.balance || "0";
    const xlmNum = parseFloat(xlmBalance);
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
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
