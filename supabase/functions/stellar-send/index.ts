import "jsr:@supabase/functions-js/edge-runtime.d";
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

// Base reserve is 2 Lumens (0.5 XLM) per account + 0.5 XLM for each entry.
// We conservatively use the minimum account reserve of 1 XLM for a basic account.
const BASE_RESERVE_XLM = 1;
const FEE_XLM = 0.00001;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secretKey, destination, amount, memo } = await req.json();

    if (!secretKey || !destination || !amount) {
      return jsonResponse(
        {
          success: false,
          error: "secretKey, destination, and amount are required",
        },
        400
      );
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return jsonResponse(
        { success: false, error: "Amount must be a positive number" },
        400
      );
    }

    // Validate keys
    let sourceKeypair: InstanceType<typeof Keypair>;
    try {
      sourceKeypair = Keypair.fromSecret(secretKey);
    } catch {
      return jsonResponse(
        { success: false, error: "Invalid secret key" },
        400
      );
    }

    try {
      Keypair.fromPublicKey(destination);
    } catch {
      return jsonResponse(
        { success: false, error: "Invalid destination address" },
        400
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

    // Read native balance from the loaded account
    const nativeBalanceEntry = Array.isArray(sourceAccount.balances)
      ? sourceAccount.balances.find(
          (b: { asset_type?: string; balance?: string }) => b.asset_type === "native"
        )
      : undefined;
    const nativeBalance = nativeBalanceEntry ? parseFloat(nativeBalanceEntry.balance ?? "0") : 0;

    // Subtract base reserve and fee to compute spendable amount
    const spendable = nativeBalance - BASE_RESERVE_XLM - FEE_XLM;
    const spendableRounded = Math.floor(spendable * 1e7) / 1e7;

    if (amountNum > spendableRounded) {
      const available = spendableRounded > 0 ? spendableRounded : 0;
      return jsonResponse(
        {
          success: false,
          error: `Insufficient balance. Available amount: ${available.toFixed(7)} XLL`,
        },
        400
      );
    }

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

    return jsonResponse({
      success: true,
      hash: submitData.hash,
      ledger: submitData.ledger,
      fee: submitData.fee_charged,
      createdAt: submitData.created_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Send transaction error:", message);
    return jsonResponse({ success: false, error: message }, 500);
  }
});
