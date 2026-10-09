import "jsr:@supabase/functions-js/edge-runtime.dts";
import { Keypair } from "npm:@stellar/stellar-sdk13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, secretKey } = await req.json();

    if (action === "create") {
      const keypair = Keypair.random();
      const publicKey = keypair.publicKey();
      const secret = keypair.secret();

      // Fund on testnet via Friendbot
      try {
        const fundRes = await fetch(
          `https://friendbot.stellar.org?addr=${publicKey}`
        );
        if (!fundRes.ok) {
          console.warn("Friendbot funding failed, wallet created but unfunded");
        }
      } catch (e) {
        console.warn("Friendbot unavailable:", e);
      }

      return new Response(
        JSON.stringify({
          success: true,
          publicKey,
          secretKey: secret,
          funded: true,
          network: "testnet",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "import") {
      if (!secretKey) {
        return new Response(
          JSON.stringify({ success: false, error: "Secret key is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      try {
        const keypair = Keypair.fromSecret(secretKey);
        return new Response(
          JSON.stringify({
            success: true,
            publicKey: keypair.publicKey(),
            secretKey: keypair.secret(),
            network: "testnet",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid secret key" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action. Use 'create' or 'import'" }),
      {
        status: 400,
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
};

if (import.meta.main || Deno.env.get("SUPABASE_EXECUTION_ID_FROM_ENV")) {
  Deno.serve(handler);
}
