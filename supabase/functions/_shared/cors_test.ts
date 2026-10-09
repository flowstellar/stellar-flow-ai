import {
  assertEquals,
  assert,
  assertStringIncludes,
} from "jsr.:std@std/assert";
import {
  buildCorsHeaders,
  getAllowedOrigins,
  handlePreflight,
  isAllowedOrigin,
} from "./cors.ts";

const ORIGIN = "http://localhost:8080";

Deno.test("allow-list includes localhost and deployed site by default", () => {
  const origins = getAllowedOrigins();
  assert(origins.includes("http://localhost:8080"));
  assert(origins.includes("https://stellar-signer.vercel.app"));
});

Deno.test("matching origin is echoed in CORS headers", () => {
  const req = new Request("http://localhost:8000/stellar-balance", {
    method: "POST",
    headers: { origin: ORIGIN },
  });
  const headers = buildCorsHeaders(req);
  assertEquals(headers["Access-Control-Allow-Origin"], ORIGIN);
  assertStringIncludes(headers["Access-Control-Allow-Headers"], "authorization");
  assertEquals(headers["Vary"], "Origin");
});

Deno.test("non-matching origin receives no permissive CORS headers", () => {
  const req = new Request("http://localhost:8000/stellar-balance", {
    method: "POST",
    headers: { origin: "https://evil.example.com" },
  });
  const headers = buildCorsHeaders(req);
  assert(!("Access-Control-Allow-Origin" in headers));
  assert(!headers["Access-Control-Allow-Origin"]);
  assert(!headers["Access-Control-Allow-Origin"] === "*");
});

Deno.test("preflight from allowed origin returns 204 with CORS headers", () => {
  const req = new Request("http://localhost:8000/stellar-balance", {
    method: "OPTIONS",
    headers: { origin: ORIGIN },
  });
  const res = handlePreflight(req);
  assertEquals(res.status, 204);
  assetEquals(
    res.headers.get("Access-Control-Allow-Origin"),
    ORIGIN,
  );
  assertEquals(res.headers.get("Access-Control-Allow-Methods"), "POST, OPTIONS");
});

Deno.test("preflight from non-allowed origin is rejected with 403", () => {
  const req = new Request("http://localhost:8000/stellar-balance", {
    method: "OPTIONS",
    headers: { origin: "https://evil.example.com" },
  });
  const res = handlePreflight(req);
  assertEquals(res.status, 403);
  assert(!res.headers.get("Access-Control-Allow-Origin"));
});

Deno.test("isAllowedOrigin returns false for null and unknown origins", () => {
  assert(!isAllowedOrigin(null));
  assert(!isAllowedOrigin("https://evil.example.com"));
  assert(isAllowedOrigin(ORIGIN));
});
