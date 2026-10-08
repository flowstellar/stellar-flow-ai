import "jsr:@supabase/functions-js/edge-runtime.d";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
} from "npm:@stellar/stellar-sdk@13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HORIZON_URL = "https://horizon-testnet.stellar.org";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller and look up the signing key server-side.
    // The secret key must NEVER be sent in the request body.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return json({ success: false, error: "Missing authorization token" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const { destination, amount, memo } = await req.json();

    if (!destination || !amount) {
      return json(
        { success: false, error: "destination and amount are required" },
        400
      );
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return json({ success: false, error: "Amount must be a positive number" }, 400);
    }

    // Look up the authenticated user's wallet server-side.
    const { data: walletRow, error: walletError } = await supabase
      .from("wallets")
      .select("public_key, secret_key, network")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletError) {
      throw new Error(`Failed to load wallet: ${walletError.message}`);
    }
    if (!walletRow || !walletRow.secret_key) {
      return json({ success: false, error: "Wallet not found for user" }, 404);
    }

    const secretKey = walletRow.secret_key as string;

    // Validate keys
    let sourceKeypair: InstanceType<typeof Keypair>;
    try {
      sourceKeypair = Keypair.fromSecret(secretKey);
    } catch {
      return json({ success: false, error: "Invalid secret key" }, 400);
    }

    try {
      Keypair.fromPublicKey(destination);
    } catch {
      return json({ success: false, error: "Invalid destination address" }, 400);
    }

    // Load source account
    const accountRes = await fetch(
      `${HORIZON_URL}/accounts/${sourceKeypair.publicKey()}`
    );
    if (!accountRes.ok) {
      throw new Error(
        `Failed to load source account [${accountRes.status}]: ${await accountRes.text()}`
      );
    }
    const sourceAccount = await accountRes.json();

    // Check if destination exists
    const destRes = await fetch(`${HORIZON_URL}/accounts/${destination}`);
    const destinationExists = destRes.ok;

    // Build transaction
    const account = {
      accountId: () => sourceKeypair.publicKey(),
      sequenceNumber: () => sourceAccount.sequence,
      incrementSequenceNumber: () => {
        sourceAccount.sequence = (
          BigInt(sourceAccount.sequence) + 1n
        ).toString();
      },
    };

    let builder = new TransactionBuilder(account as any, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    });

    if (destinationExists) {
      builder = builder.addOperation(
        Operation.payment({
          destination,
          asset: Asset.native(),
          amount: amountNum.toFixed(7),
        })
      );
    } else {
      builder = builder.addOperation(
        Operation.createAccount({
          destination,
          startingBalance: amountNum.toFixed(7),
        })
      );
    }

    if (memo) {
      builder = builder.addMemo(Memo.text(memo.substring(0, 28)));
    }

    const transaction = builder.setTimeout(30).build();
    transaction.sign(sourceKeypair);
    const xdr = transaction.toXDR();

    // Submit transaction
    const submitRes = await fetch(`${HORIZON_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `tx=${encodeURIComponent(xdr)}`,
    });

    const submitData = await submitRes.json();

    if (!submitRes.ok) {
      const extras = submitData.extras?.result_codes;
      throw new Error(
        `Transaction failed: ${JSON.stringify(extras || submitData.detail || submitData.title)}`
      );
    }

    return json({
      success: true,
      hash: submitData.hash,
      ledger: submitData.ledger,
      fee: submitData.fee_charged,
      createdAt: submitData.created_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Send transaction error:", message);
    return json({ success: false, error: message }, 500);
  }
});
