import { supabase } from '@/integrations/supabase/client';

export interface WalletData {
  publicKey: string;
  secretKey: string;
  network: string;
  funded?: boolean;
}

export interface BalanceData {
  funded: boolean;
  balances: Array<{ asset_type: string; balance: string; asset_code?: string; asset_issuer?: string }>;
  xlmBalance: string;
  /** USD value as a formatted string. `null` when the rate lookup failed. */
  usdValue: string | null;
  /** XLM/USD rate used to derive `usdValue`. `null` when unavailable. */
  rate: number | null;
  /** ISO timestamp of when the rate was obtained. */
  rateTimestamp: string;
  /** Source of the rate (e.g. "coingecko"). */
  rateSource: string;
  /** True when the rate lookup failed and `usdValue` is null. */
  rateUnavailable: boolean;
  sequence?: string;
}

export interface SendResult {
  hash: string;
  ledger: number;
  fee: string;
  createdAt: string;
}

export const MIN_ACCOUNT_BALANCE = 1;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function decodeBase32(input: string): Uint8Array | null {
  const lookup = new Map<string, number>();
  for (let i = 0; i < BASE32_ALPHABET.length; i++) {
    lookup.set(BASE32_ALPHABET[i], i);
  }

  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of input) {
    const v = lookup.get(char);
    if (v === undefined) return null;
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >>> bits) & 0xff);
    }
  }

  return new Uint8Array(output);
}

function cr16Checksum(data: Uint8Array): number {
  let crc = 0x0000;
  const poly = 0x1021;
  for (const byte of data) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ poly) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc & 0xffff;
}

export function isValidStellarAddress(address: string): boolean {
  if (!address || address.length !== 56) return false;
  if (!address.startsWith('G')) return false;
  if (!/^G[A-Z0-9]{55}$/.test(address)) return false;

  const decoded = decodeBase32(address);
  if (!decoded || decoded.length !== 35) return false;

  const payload = decoded.slice(0, 33);
  const checksum = (decoded[33] << 8) | decoded[34];
  return cr16Checksum(payload) === checksum;
}

export const stellarApi = {
  async createWallet(): Promise<WalletData> {
    const { data, error } = await supabase.functions.invoke('stellar-wallet', {
      body: { action: 'create' },
    });
    if (error) throw new Error(error.message || 'Failed to create wallet');
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async importWallet(secretKey: string): Promise<WalletData> {
    const { data, error } = await supabase.functions.invoke('stellar-wallet', {
      body: { action: 'import', secretKey },
    });
    if (error) throw new Error(error.message || 'Failed to import wallet');
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async getBalance(publicKey: string): Promise<BalanceData> {
    const { data, error } = await supabase.functions.invoke('stellar-balance', {
      body: { publicKey },
    });
    if (error) throw new Error(error.message || 'Failed to fetch balance');
    if (!data.success) throw new Error(data.error);
    return data as BalanceData;
  },

  async sendPayment(params: {
    secretKey: string;
    destination: string;
    amount: string;
    memo?: string;
  }): Promise<SendResult> {
    const { data, error } = await supabase.functions.invoke('stellar-send', {
      body: params,
    });
    if (error) throw new Error(error.message || 'Failed to send payment');
    if (!data.success) throw new Error(data.error);
    return data;
  },
};
aW1wb3J0IHsgc3VwYWJhc2UgfSBmcm9tICdAL2ludGVncmF0aW9ucy9zdXBhYmFzZS9jbGllbnQnOwoKZXhwb3J0IGludGVyZmFjZSBXYWxsZXREYXRhIHsKICBwdWJsaWNLZXk6IHN0cmluZzsKICBzZWNyZXRLZXk6IHN0cmluZzsKICBuZXR3b3JrOiBzdHJpbmc7Cn0KCmV4cG9ydCBpbnRlcmZhY2UgQmFsYW5jZURhdGEgewogIGZ1bmRlZDogYm9vbGVhbjsKICBiYWxhbmNlczogQXJyYXk8eyBhc3NldF90eXBlOiBzdHJpbmc7IGJhbGFuY2U6IHN0cmluZzsgYXNzZXRfY29kZT86IHN0cmluZzsgYXNzZXRfaXNzdWVyPzogc3RyaW5nIH0+OwogIHhsbUJhbGFuY2U6IHN0cmluZzsKICB1c2RWYWx1ZTogc3RyaW5nOwp9CgpleHBvcnQgaW50ZXJmYWNlIFNlbmRSZXN1bHQgewogIGhhc2g6IHN0cmluZzsKICBsZWRnZXI6IG51bWJlcjsKICBmZWU6IHN0cmluZzsKICBjcmVhdGVkQXQ6IHN0cmluZzsKfQoKLyoqCiAqIFN0ZWxsYXIgTWVtby50ZXh0IGxpbWl0IGluIFVURi04IGJ5dGVzLiBUaGUgY2xpZW50IG11c3QgZW5mb3JjZSB0aGlzIGJ5dGUKICogYnVkZ2V0IHJhdGhlciB0aGFuIGJ5IFVURi0xNiBjb2RlIHVuaXRzLCBvdGhlcndpc2UgZW1vamktcmljaCBtZW1vcyBwYXNzCiAqIHRoZSBjbGllbnQgY2FwIGFuZCBhcmUgc2lsZW50bHkgdHJ1bmNhdGVkIChvciByZWplY3RlZCkgc2VydmVyLXNpZGUuCiAqLwpleHBvcnQgY29uc3QgTUVNT19NQVhfQllURVMgPSAyODsKCi eightL1VURi04IGJ5dGUgbGVuZ3RoIG9mIGEgbWVtbyBzdHJpbmcuCiAqLwpleHBvcnQgZnVuY3Rpb24gbWVtb0J5dGVMZW5ndGgobWVtbzogc3RyaW5nKTogbnVtYmVyIHsKICByZXR1cm4gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKG1lbW8pLmxlbmd0aDsKfQoKLyoqCiAqIFJldHVybnMgdHJ1ZSB3aGVuIHRoZSBtZW1vIGZpdHMgd2l0aGluIHRoZSBVVEYtOCBieXRlIGJ1ZGdldCBhbmQgY2FuIGJlCiAqIHN1Ym1pdHRlZCBhcyBhIFN0ZWxsYXIgTWVtby50ZXh0LgogKi8KZXhwb3J0IGZ1bmN0aW9uIGlzTWVtb1ZhbGlkKG1lbW86IHN0cmluZyk6IGJvb2xlYW4gewogIHJldHVybiBtZW1vQnl0ZUxlbmd0aChtZW1vKSA8PSBNRU1PX01BWF9CWVRFUzsKfQoKZXhwb3J0IGNvbnN0IHN0ZWxsYXJBcGkgPSB7CiAgYXN5bmMgY3JlYXRlV2FsbGV0KCk6IFByb21pc2U8V2FsbGV0RGF0YT4gewogICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnc3RlbGxhci13YWxsZXQnLCB7CiAgICAgIGJvZHk6IHsgYWN0aW9uOiAnY3JlYXRlJyB9LAogICAgfSk7CiAgICBpZiAoZXJyb3IpIHRocm93IG5ldyBFcnJvcihlcnJvci5tZXNzYWdlIHx8ICdGYWlsZWQgdG8gY3JlYXRlIHdhbGxldCcpOwogICAgaWYgKCFkYXRhLnN1Y2Nlc3MpIHRocm93IG5ldyBFcnJvcihkYXRhLmVycm9yKTsKICAgIHJldHVybiBkYXRhOwogIH0sCgogIGFzeW5jIGltcG9ydFdhbGxldChzZWNyZXRLZXk6IHN0cmluZyk6IFByb21pc2U8V2FsbGV0RGF0YT4gewogICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnc3RlbGxhci13YWxsZXQnLCB7CiAgICAgIGJvZHk6IHsgYWN0aW9uOiAnaW1wb3J0Jywgc2VjcmV0S2V5IH0sCiAgICB9KTsKICAgIGlmIChlcnJvcikgdGhyb3cgbmV3IEVycm9yKGVycm9yLm1lc3NhZ2UgfHwgJ0ZhaWxlZCB0byBpbXBvcnQgd2FsbGV0Jyk7CiAgICBpZiAoIWRhdGEuc3VjY2VzcykgdGhyb3cgbmV3IEVycm9yKGRhdGEuZXJyb3IpOwogICAgcmV0dXJuIGRhdGE7CiAgfSwKCiAgYXN5bmMgZ2V0QmFsYW5jZShwdWJsaWNLZXk6IHN0cmluZyk6IFByb21pc2U8QmFsYW5jZURhdGE+IHsKICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3N0ZWxsYXItYmFsYW5jZScsIHsKICAgICAgYm9keTogeyBwdWJsaWNLZXkgfSwKICAgIH0pOwogICAgaWYgKGVycm9yKSB0aHJvdyBuZXcgRXJyb3IoZXJyb3IubWVzc2FnZSB8fCAnRmFpbGVkIHRvIGZldGNoIGJhbGFuY2UnKTsKICAgIGlmICghZGF0YS5zdWNjZXNzKSB0aHJvdyBuZXcgRXJyb3IoZGF0YS5lcnJvcik7CiAgICByZXR1cm4gZGF0YTsKICB9LAoKICBhc3luYyBzZW5kUGF5bWVudChwYXJhbXM6IHsKICAgIHNlY3JldEtleTogc3RyaW5nOwogICAgZGVzdGluYXRpb246IHN0cmluZzsKICAgIGFtb3VudDogc3RyaW5nOwogICAgbWVtbz86IHN0cmluZzsKICB9KTogUHJvbWlzZTxTZW5kUmVzdWx0PiB7CiAgICBpZiAocGFyYW1zLm1lbW8gIT09IHVuZGVmaW5lZCAmJiAhbWVtb1ZhbGlkKHBhcmFtcy5tZW1vKSkgewogICAgICB0aHJvdyBuZXcgRXJyb3IoCiAgICAgICAgYE1lbW8gZXhjZWVkcyB0aGUgJHtNRU1PX01BWF9CWVRFU30tYnl0ZSBsaW1pdCAoJHttZW1vQnl0ZUxlbmd0aChwYXJhbXMubWVtbyl9IGJ5dGVzKS4gU2hvcnRlbiB5b3VyIG5vdGUuYCwKICAgICAgKTsKICAgIH0KICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3N0ZWxsYXItc2VuZCcsIHsKICAgICAgYm9keTogcGFyYW1zLAogICAgfSk7CiAgICBpZiAoZXJyb3IpIHRocm93IG5ldyBFcnJvcihlcnJvci5tZXNzYWdlIHx8ICdGYWlsZWQgdG8gc2VuZCBwYXltZW50Jyk7CiAgICBpZiAoIWRhdGEuc3VjY2VzcykgdGhyb3cgbmV3IEVycm9yKGRhdGEuZXJyb3IpOwogICAgcmV0dXJuIGRhdGE7CiAgfSwKfTsK