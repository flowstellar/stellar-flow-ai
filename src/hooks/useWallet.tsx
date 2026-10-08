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

const isStellarSecretKey = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  return /^S[A-Z0-9]{56}$/.test(value);
};

const containsPlainSecretKey = (value: unknown): boolean => {
  if (typeof value === 'string') return isStellarSecretKey(value);
  if (Array.isArray(value)) return value.some(containsPlainSecretKey);
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(containsPlainSecretKey);
  }
  return false;
};

const sanitizeWalletForStorage = (wallet: WalletData): Omit<WalletData, 'secretKey'> => {
  const { secretKey: __secretKey, ...safe } = wallet;
  return safe;
};

const persistWallet = (wallet: WalletData) => {
  const safe = sanitizeWalletForStorage(wallet);
  if (containsPlainSecretKey(safe)) {
    throw new Error('Refusing to persist wallet containing a plaintext secret key');
  }
  localStorage.setItem(WALLET_KEY, JSON.stringify(safe));
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Only non-sensitive metadata is restored on load. The secret key is never
  // read from localStorage and must be re-provided by the user (e.g. via the PIN flow).
  const [publicKey, setPublicKey] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(WALLET_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as Partial<WalletData> | null;
      if (!parsed || typeof parsed.publicKey !== 'string') return null;
      return parsed.publicKey;
    } catch {
      return null;
    }
  });

  const saveWallet = (w: WalletData) => {
    setWallet(w);
    setPublicKey(w.publicKey);
    persistWallet(w);
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
    const address = wallet?.publicKey ?? publicKey;
    if (!address) return;
    setBalanceLoading(true);
    try {
      const data = await stellarApi.getBalance(address);
      setBalance(data);
    } catch (e) {
      console.error('Balance fetch error:', e);
    } finally {
      setBalanceLoading(false);
    }
  }, [wallet?.publicKey, publicKey]);

  const logout = useCallback(() => {
    setWallet(null);
    setBalance(null);
    setPublicKey(null);
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
