import { describe, it, expect } from "vitest";

const MEMO_MAX_BYTES = 28;

function memoByteLength(memo: string): number {
  return new TextEncoder().encode(memo).length;
}

function isMemoValid(memo: string): boolean {
  return memoByteLength(memo) <= MEMO_MAX_BYTES;
}

describe("memo validation", () => {
  it("rejects an emoji-heavy memo that exceeds the byte budget", () => {
    const emojiMemo = "😀😀😀😀😀😀😀😀😀😀😀😀😀";
    expect(emojiMemo.length).toBeLessThanOrEqual(MEMO_MAX_BYTES);
    expect(memoByteLength(emojiMemo)).toBeGreaterThan(MEMO_MAX_BYTES);
    expect(isMemoValid(emojiMemo)).toBe(false);
  });

  it("accepts a memo within the byte budget", () => {
    const memo = "hello world";
    expect(memoByteLength(memo)).toBeLessThanOrEqual(MEMO_MAX_BYTES);
    expect(isMemoValid(memo)).toBe(true);
  });

  it("counts bytes, not code units", () => {
    const memo = "😀";
    expect(memo.length).toBe(2);
    expect(memoByteLength(memo)).toBe(4);
  });

  it("treats an empty memo as valid", () => {
    extpect(memoByteLength("")).toBe(0);
    expect(isMemoValid("")).toBe(true);
  });
});
