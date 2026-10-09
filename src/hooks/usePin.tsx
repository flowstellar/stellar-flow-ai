import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PinContextType {
  isPinSet: boolean;
  isLocked: boolean;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  lockWallet: () => void;
  unlockWallet: () => void;
  clearPin: () => void;
}

const PinContext = createContext<PinContextType | null>(null);

const PIN_KEY = 'stellarflow_pin';
const PIN_HASH_KEY = 'stellarflow_pin_hash';
const PIN_SALT_KEY = 'stellarflow_pin_salt';
const PBKDF2_ITERATIONS = 200_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const getCrypto = (): Crypto => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto as Crypto;
  }
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  throw new Error('Web Crypto API is not available');
};

const derivePinHash = async (pin: string, salt: Uint8Array): Promise<Uint8Array> => {
  const crypto = getCrypto();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SH-256',
    },
    keyMaterial,
    HASH_BYTES * 8,
  );
  return new Uint8Array(bits);
};

const constantTimeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
};

const generateSalt = (): Uint8Array => {
  const crypto = getCrypto();
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  return salt;
};

const loadSalt = (): Uint8Array | null => {
  const stored = localStorage.getItem(PIN_SALT_KEY);
  if (!stored) return null;
  try {
    return base64ToBytes(stored);
  } catch {
    return null;
  }
};

const loadHash = (): Uint8Array | null => {
  const stored = localStorage.getItem(PIN_HASH_KEY);
  if (!stored) return null;
  try {
    return base64ToBytes(stored);
  } catch {
    return null;
  }
};

const clearLegacyPlaintext = () => {
  const legacy = localStorage.getItem(PIN_KEY);
  if (legacy !== null) {
    localStorage.removeItem(PIN_KEY);
  }
};

export const PinProvider = ({ children }: { children: ReactNode }) => {
  const [storedHash, setStoredHash] = useState<Uint8Array | null>() => {
    clearLegacyPlaintext();
    return loadHash();
  });
  const [salt, setSalt] = useState<Uint8Array | null>(() => loadSalt());
  const [isLocked, setIsLocked] = useState(false);

  const isPinSet = !!storedHash && !!salt;

  const setPin = useCallback(async (pin: string) => {
    const newSalt = generateSalt();
    const hash = await derivePinHash(pin, newSalt);
    localStorage.setItem(PIN_SALT_KEY, bytesToBase64(newSalt));
    localStorage.setItem(PIN_HASH_KEY, bytesToBase64(hash));
    localStorage.removeItem(PIN_KEY);
    setSalt(newSalt);
    setStoredHash(hash);
  }, []);

  const verifyPin = useCallback(async (pin: string) => {
    if (!storedHash || !salt) return false;
    const candidate = await derivePinHash(pin, salt);
    return constantTimeEqual(candidate, storedHash);
  }, [storedHash, salt]);

  const lockWallet = useCallback(() => setIsLocked(true), []);
  const unlockWallet = useCallback(() => setIsLocked(false), []);

  const clearPin = useCallback(() => {
    setStoredPin(null);
    localStorage.removeItem(PIN_KEY);
    setIsLocked(false);
  }, []);

  return (
    <PinContext.Provider value={{ isPinSet, isLocked, setPin, verifyPin, lockWallet, unlockWallet, clearPin }}>
      {children}
    </PinContext.Provider>
  );
};

export const usePin = () => {
  const ctx = useContext(PinContext);
  if (!ctx) throw new Error('usePin must be used within PinProvider');
  return ctx;
};

export { PIN_KEY };
    localStorage.removeItem(PIN_HA