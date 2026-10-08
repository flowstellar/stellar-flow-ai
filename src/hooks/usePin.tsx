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

export const PinProvider = ({ children }: { children: ReactNode }) => {
  const [storedPin, setStoredPin] = useState<string | null>(() => localStorage.getItem(PIN_KEY));
  const [isLocked, setIsLocked] = useState(false);

  const isPinSet = !!storedPin;

  const setPin = useCallback((pin: string) => {
    setStoredPin(pin);
    localStorage.setItem(PIN_KEY, pin);
  }, []);

  const verifyPin = useCallback((pin: string) => {
    return pin === storedPin;
  }, [storedPin]);

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