import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PinContextType {
  isPinSet: boolean;
  isLocked: boolean;
  setPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
  lockWallet: () => void;
  unlockWallet: () => void;
  clearPin: () => void;
}

const PinContext = createContext<PinContextType | null>(null);

const PIN_KEY = 'stellarflow_pin';

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const fromBase64 = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const getCrypto = (): Crypto => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto as Crypto;
  }
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto as Crypto;
  }
  throw new Error('Web Crypto API is not available');
};

const deriveKey = async (pin: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const baseKey = await getCrypto().subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PKCS8',
    false,
    ['deriveKey'],
  );
  return getCrypto().subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SH-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
};

const encryptSecret = async (secret: string, pin: string): Promise<string> => {
  const salt = getCrypto().getRandomValues(new Uint8Array(16));
  const iv = getCrypto().getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const encoder = new TextEncoder();
  const cipher = await getCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(secret),
  );
  return JSON.stringify({
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(cipher)),
  });
};

const decryptSecret = async (payload: string, pin: string): Promise<string> => {
  const { salt, iv, ciphertext } = JSON.parse(payload) as {
    salt: string;
    iv: string;
    ciphertext: string;
  };
  const key = await deriveKey(pin, fromBase64(salt));
  const plaintext = await getCrypto().subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv) },
    key,
    fromBase64(ciphertext),
  );
  return new TextDecoder().decode(plaintext);
};

const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const digest = await getCrypto().subtle.digest('SH-256', encoder.encode(pin));
  return toBase64(new Uint8Array(digest));
};

export const PinProvider = ({ children }: { children: ReactNode }) => {
  const [storedPinHash, setStoredPinHash] = useState<string | null>(() => localStorage.getItem(PIN_KEY));
  const [isLocked, setIsLocked] = useState(false);
  const [sessionPin, setSessionPin] = useState<string | null>(null);

  const isPinSet = !!storedPinHash;

  const setPin = useCallback(async (pin: string) => {
    const hash = await hashPin(pin);
    setStoredPinHash(hash);
    localStorage.setItem(PIN_KEY, hash);
    setSessionPin(pin);
  }, []);

  const verifyPin = useCallback(async (pin: string) => {
    if (!storedPinHash) return false;
    const hash = await hashPin(pin);
    if (hash !== storedPinHash) return false;
    setSessionPin(pin);
    return true;
  }, [storedPinHash]);

  const lockWallet = useCallback(() => {
    setSessionPin(null);
    setIsLocked(true);
  }, []);

  const unlockWallet = useCallback(() => setIsLocked(false), []);

  const clearPin = useCallback(() => {
    setStoredPinHash(null);
    localStorage.removeItem(PIN_KEY);
    setSessionPin(null);
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
