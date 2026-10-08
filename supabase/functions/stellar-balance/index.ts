import "jsr:@supabase/functions-js/edge-runtime.dts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HORIZON_URL = "https://horizon-testnet.stellar.org";

const XLM_USD_PRICE = 0.5;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Fetch account from Horizon
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
          usdValue: "$0.00",
        });
      }
      throw new Error(`Horizon API error [${res.status}]: ${await res.text()}`);
    }

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
});
