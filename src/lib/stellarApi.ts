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
