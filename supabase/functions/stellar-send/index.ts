import "jsr:@supabase/functions-js/edge-runtime.dts";
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secretKey, destination, amount, memo } = await req.json();

    if (!secretKey || !destination || !amount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "secretKey, destination, and amount are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Amount must be a positive number" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate keys
    let sourceKeypair: InstanceType<typeof Keypair>;
    try {
      sourceKeypair = Keypair.fromSecret(secretKey);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid secret key" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    try {
      Keypair.fromPublicKey(destination);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid destination address" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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

    return new Response(
      JSON.stringify({
        success: true,
        hash: submitData.hash,
        ledger: submitData.ledger,
        fee: submitData.fee_charged,
        createdAt: submitData.created_at,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Send transaction error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
