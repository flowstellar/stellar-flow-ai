// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d";
import {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
} from "npm:@stellar/stellar-sdk@13";

// ---- CORS ----
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HORIZON_URL = "https://horizon-testnet.stellar.org";

// ---- Idempotency + rate limiting state ----
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window per caller

interface IdempotencyRecord {
  hash: string;
  ledger?: number;
  fee?: string;
  createdAt?: string;
  expiresAt: number;
}

interface RateBucket {
  count: number;
  windowStart: number;
}

// In-memory stores. Edge function instances are reused between invocations,
// so this provides best-effort idempotency and throttling without external deps.
const idempotencyStore = new Map<string, IdempotencyRecord>();
const rateBuckets = new Map<string, RateBucket>();

function pruneIdempotency(now: number) {
  for (const [key, record] of idempotencyStore) {
    if (record.expiresAt <= now) idempotencyStore.delete(key);
  }
}

// Returns whether the caller is allowed and, if not, seconds until retry.
function checkRateLimit(callerId: string, now: number): { allowed: boolean; retryAfter?: number } {
  const bucket = rateBuckets.get(callerId);
  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(callerId, { count: 1, windowStart: now });
    return { allowed: true };
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil(
      (bucket.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000
    );
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }
  bucket.count += 1;
  return { allowed: true };
}

// Derive a stable caller identity from headers or the secret key.
function getCallerId(req: Request, body: Record<string, unknown>): string {
  const auth = req.headers.get("authorization");
  if (auth) return `auth:${auth}`;
  const apikey = req.headers.get("apikey");
  if (apikey) return `apikey:${apikey}`;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return `ip:${forwarded.split(",")[0].trim()}`;
  const secret = typeof body.secretKey === "string" ? body.secretKey : "";
  if (secret) {
    // Hash the secret key so we do not keep plaintext keys in memory.
    let hash = 0;
    for (let i = 0; i < secret.length; i++) {
      hash = (hash * 31 + secret.charCodeAt(i)) | 0;
    }
    return `secret:${hash}`;
  }
  return "anonymous";
}

// Helper for JSON responses with CORS + optional extra headers.
function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

// ---- Handler ----
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    const { secretKey, destination, amount, memo } = body;
    // Optional idempotency key from the client.
    const idempotencyKey =
      typeof body.idempotencyKey === "string" && body.idempotencyKey.length > 0
        ? body.idempotencyKey
        : undefined;

    const now = Date.now();
    pruneIdempotency(now);

    // Idempotency check happens before any validation/submit so a repeat
    // returns the original result without touching Horizon.
    if (idempotencyKey) {
      const existing = idempotencyStore.get(idempotencyKey);
      if (existing && existing.expiresAt > now) {
        return jsonResponse({
          success: true,
          hash: existing.hash,
          ledger: existing.ledger,
          fee: existing.fee,
          createdAt: existing.createdAt,
          idempotent: true,
        });
      }
    }

    // Rate limit by caller identity (before submitting).
    const callerId = getCallerId(req, body);
    const rate = checkRateLimit(callerId, now);
    if (!rate.allowed) {
      return jsonResponse(
        { success: false, error: "Rate limit exceeded. Please retry later." },
        429,
        { "Retry-After": String(rate.retryAfter ?? 1) }
      );
    }

    // Validate required fields.
    if (!secretKey || !destination || !amount) {
      return jsonResponse(
        { success: false, error: "secretKey, destination, and amount are required" },
        400
      );
    }

    // Validate amount.
    const amountNum = parseFloat(amount as string);
    if (isNaN(amountNum) || amountNum <= 0) {
      return jsonResponse(
        { success: false, error: "Amount must be a positive number" },
        400
      );
    }

    // Validate keys.
    let sourceKeypair: InstanceType<typeof Keypair>;
    try {
      sourceKeypair = Keypair.fromSecretKey(secretKey as string);
    } catch {
      return jsonResponse({ success: false, error: "Invalid secret key" }, 400);
    }

    try {
      Keypair.fromPublicKey(destination as string);
    } catch {
      return jsonResponse(
        { success: false, error: "Invalid destination address" },
        400
      );
    }

    // Load source account.
    const accountRes = await fetch(
      `${HORIZON_URL}/accounts/${sourceKeypair.publicKey()}`
    );
    if (!accountRes.ok) {
      throw new Error(
        `Failed to load source account [${accountRes.status}]: ${await accountRes.text()}`
      );
    }
    const sourceAccount = await accountRes.json();

    // Check if destination exists.
    const destRes = await fetch(`${HORIZON_URL}/accounts/${destination}`);
    const destinationExists = destRes.ok;

    // Build transaction.
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
          destination: destination as string,
          asset: Asset.native(),
          amount: amountNum.toFixed(7),
        })
      );
    } else {
      builder = builder.addOperation(
        Operation.createAccount({
          destination: destination as string,
          startingBalance: amountNum.toFixed(7),
        })
      );
    }

    if (memo) {
      builder = builder.addMemo(Memo.text(String(memo).substring(0, 28)));
    }

    const transaction = builder.setTimeout(30).build();
    transaction.sign(sourceKeypair);
    const xdr = transaction.toXDR();

    // Submit transaction.
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

    // Record the submitted key so a repeat returns the original hash.
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, {
        hash: submitData.hash,
        ledger: submitData.ledger,
        fee: submitData.fee_charged,
        createdAt: submitData.created_at,
        expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
      });
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
