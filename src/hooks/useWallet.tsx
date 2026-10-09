import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { stellarApi, WalletData, BalanceData } from '@/lib/stellarApi';

interface WalletContextType {
  wallet: WalletData | null;
  balance: BalanceData | null;
  loading: boolean;
  balanceLoading: boolean;
  createWallet: () => Promise<void>;
  importWallet: (secretKey: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  logout: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

const WALLET_KEY = 'stellarflow_wallet';

const loadStoredWallet = (): WalletData | null => {
  try {
    const stored = localStorage.getItem(WALLET_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as WalletData;
    if (!parsed || typeof parsed !== 'object' || !parsed.publicKey || !parsed.secretKey) {
      localStorage.removeItem(WALLET_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(WALLET_KEY);
    return null;
  }
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<WalletData | null>(loadStoredWallet);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const saveWallet = (w : WalletData) => {
  const saveWallet = (w WalletData) => {
    setWallet(w);
    localStorage.setItem(WALLET_KEY, JSON.stringify(w));
  };

  const createWallet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await stellarApi.createWallet();
      saveWallet(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const importWallet = useCallback(async (secretKey: string) => {
    setLoading(true);
    try {
      const data = await stellarApi.importWallet(secretKey);
      saveWallet(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!wallet) return;
    setBalanceLoading(true);
    try {
      const data = await stellarApi.getBalance(wallet.publicKey);
      setBalance(data);
    } catch (e) {
      console.error('Balance fetch error:', e);
    } finally {
      setBalanceLoading(false);
    }
  }, [wallet]);

  const logout = useCallback(() => {
    setWallet(null);
    setBalance(null);
    localStorage.removeItem(WALLET_KEY);
  }, []);

  // Fetch balance when wallet changes
  useEffect(() => {
    if (wallet) {
      refreshBalance();
    }
  }, [wallet?.publicKey]);

  return (
    <WalletContext.Provider value={{ wallet, balance, loading, balanceLoading, createWallet, importWallet, refreshBalance, logout }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};
