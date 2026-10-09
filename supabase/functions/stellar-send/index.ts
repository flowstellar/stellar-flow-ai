import "jsr:@supabase/functions-js/edge-runtime.dts";
import "jsr:@supabase/functions-js/edge-runtime.d";
import {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  Account,
} from "npm:@stellar/stellar-sdk@13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HORIZON_URL = "https://horizon-testnet.stellar.org";

const MINIMUM_ACCOUNT_BALANCE = 1; // 1 XLM base reserve
interface HorizonAccountResponse {
  sequence: string;
  [key: string]: unknown;
// Stellar MEMO_TEXT is limited to 28 bytes. We clamp by UTF-8 byte length,
// not by JavaScript `String.length` (which counts UTf-16 code units and is
// wrong for emoji and other non-BMP characters).
const MEMO_BYTE_LIMIT = 28;

function truncateUtf8Bytes(value: string, maxBytes: number): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  if (bytes.length <= maxBytes) return value;

  // Walk backwards from the byte cutoff until we have a valid UTF-8 boundary.
  // A continuation byte has the form 10xxxxxxx, so we stop at the first byte
  // that is not a continuation byte.
  let end = maxBytes;
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) {
    end--;
  }
  // If the byte at `end` is the start of a multi-byte sequence that would extend
  // past the limit, drop it entirely.
  const lead = bytes[end];
  let sequenceLength = 1;
  if (lead >= 0xf0) sequenceLength = 4;
  else if (lead >= 0xe0) sequenceLength = 3;
  else if (lead >= 0xc0) sequenceLength = 2;
  if (end + sequenceLength > maxBytes) {
    end--;
  }
  return new TextDecoder().decode(bytes.subarray(0, end));
}

// Memo.text accepts only printable ASCII characters. When the memo contains
// anything outside that range (emoji, Cyrillic, curly apostrophe, etc.) we
// encode the UTF-8 bytes as a latin1 string so the memo still round-trips
 // through the chain. The byte budget is enforced before encoding.
function buildMemo(rawMemo: string): Memo {
  const memo = truncateUtf8Bytes(rawMemo, MEMO_BYTE_LIMIT);
  if (memo.length === 0) {
    throw new Error("Memo is empty after truncation");
  }

 // ASCII-only memos go through the native MEMO_TEXT path unchanged.
  if (/^[\x20-\x7e]*$/.test(memo)) {
    return Memo.text(memo);
  }

  // Non-ASCII: encode the UTF-8 bytes as a latin1 string that the SDK
  // accepts as a MEMO_TEXT. This preserves the original bytes on chain.
  const bytes = new TextEncoder().encode(memo);
  let latin1 = "";
  for (const b  of bytes) {
    latin1 += String.fromCharCode(b);
  }
  try {
    return Memo.text(latin1);
  } catch {
    // Last resort: fall back to a hash of the original memo so the transaction
    // can still be submitted.
    return Memo.hash(Buffer.from(memo, "utf-8"));
  }
}

Deno.serve(async (req) => {
export const handler = async (req: Request): Promise<Response> => {
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
        },
      );
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Amount must be a positive number",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
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
        },
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
        },
      );
    }

    // Load source account
    const accountRes = await fetch(
      `${HORIZON_URL}/accounts/${sourceKeypair.publicKey()}`,
    );
    if (!accountRes.ok) {
      throw new Error(
        `Failed to load source account [${accountRes.status}]: ${await accountRes.text()}`,
      );
    }
    const sourceAccount = (await accountRes.json()) as HorizonAccountResponse;

    // Check if destination exists
    const destRes = await fetch(`${HORIZON_URL}/accounts/${destination}`);
    const destinationExists = destRes.ok;

    // Enforce minimum balance for new accounts
    if (!destinationExists && amountNum < MINIMUM_ACCOUNT_BALANCE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Destination account does not exist. Creating it requires a minimum of ${MINIMUM_ACCOUNT_BALANCE} XLM. Please fund the account first or send at least ${MINIMUM_ACCOUNT_BALANCE} XLM.`,
          minimum: MINIMUM_ACCOUNT_BALANCE,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build transaction
    // The Stellar SDK accepts any object implementing the Account interface
    // (accountId, sequenceNumber, incrementSequenceNumber). We build a lightweight
    // adapter around the Horizon response instead of fetching a full Account object.
    const account: Account = {
      accountId: () => sourceKeypair.publicKey(),
      sequenceNumber: () => sourceAccount.sequence,
      incrementSequenceNumber: () => {
        sourceAccount.sequence = (
          BigInt(sourceAccount.sequence) + 1n
        ).toString();
      },
    } as Account;

    let builder = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    });

    if (destinationExists) {
      builder = builder.addOperation(
        Operation.payment({
          destination,
          asset: Asset.native(),
          amount: amountNum.toFixed(7),
        }),
      );
    } else {
      builder = builder.addOperation(
        Operation.createAccount({
          destination,
          startingBalance: amountNum.toFixed(7),
        }),
      );
    }

    if (memo !== undefined && memo !== null && String(memo).length > 0) {
      try {
        builder = builder.addMemo(buildMemo(String(memo)));
      } catch (err) {
        const detail = err instanceof Error ? err.message : "Unknown error";
        return new Response(
          JSON.stringify({
            success: false,
            error: `Memo cannot be represented on-chain: ${detail}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
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
        `Transaction failed: ${JSON.stringify(extras || submitData.detail || submitData.title)}`,
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
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Send transaction error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
