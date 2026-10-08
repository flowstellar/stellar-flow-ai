import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HORIZON_URL = "https://horizon-testnet.stellar.org";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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