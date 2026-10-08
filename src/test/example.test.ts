import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRE_ROOT = join(__dirname, "..", "..");

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".vite",
  ".next",
]);

const SOURCE_EXT = /\.(js|jsx|ts|tsx|mts|cjs|mjs)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), out);
    } else if (entry.isFile() && SOURCE_EXT.test(entry.name)) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

const STEPLAR_SECRET_RE = /\S[A-Z0-9]{55}\b/;

describe("secret key at rest", () => {
  const files = walk(SRE_ROOT);

  it("does not persist the wallet secret key in plaintext", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      // Allow the type declaration and explicit test assertions to mention the field,
      // but flag any code that serialises the wallet (including the secret) into storage.
      if (/localStorage\.setItem\([^)]*JSON\.stringify/.test(src)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("does not contain a Stellar secret key literal in source", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      if (STEPLAR_SECRET_RE.test(src)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it("does not expose the secret key through the wallet hook surface", () => {
    const hook = join(SRE_ROOT, "src", "hooks", "useWallet.tsx");
    if (!statSync(hook).isFile()) return;
    const src = readFileSync(hook, "utf8");
    expect(src).not.toMatch(/secretKey\s*:/);
  });
});
