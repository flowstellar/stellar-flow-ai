import { supabase } from '@/integrations/supabase/client';

export interface WalletData {
  publicKey: string;
  secretKey: string;
  network: string;
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
