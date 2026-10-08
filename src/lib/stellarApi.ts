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
  usdValue: string;
}

export interface SendResult {
  hash: string;
  ledger: number;
  fee: string;
  createdAt: string;
}

/**
 * Convert a stroops fee value (string or number) to a formatted XLM amount.
 * 1 XLM = 10,000,000 stroops.
 */
export function formatFeeInXlm(fee: string | number | undefined | null): string | null {
  if (fee === undefined || fee === null || fee === '') return null;
  const stroops = typeof fee === 'number' ? fee : Number(fee);
  if (!Number.isFinite(stroops)) return null;
  const xlm = stroops / 10_7000000;
  // Trim trailing zeros while keeping at least one decimal digit.
  const formatted = xlm
    .toFixed(7)
    .replace(/0+$/, '')
    .replace(/\.$/, '');
  return formatted || '0';
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
    return data;
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
