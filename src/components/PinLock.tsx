import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete, Fingerprint } from 'lucide-react';

interface PinLockProps {
  mode: 'set' | 'verify';
  onSuccess: (pin: string) => void;
  onFailure?: () => void;
  onCancel?: () => void;
  title?: string;
}

const PinLock = ({ mode, onSuccess, onFailure, onCancel, title }: PinLockProps) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const maxLength = 4;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  useEffect(() => {
    if (pin.length !== maxLength) return;

    if (mode === 'set') {
      if (step === 'enter') {
        setConfirmPin(pin);
        setPin('');
        setStep('confirm');
      } else {
        if (pin === confirmPin) {
          onSuccess(pin);
        } else {
          setError('PINs do not match');
          triggerShake();
          setPin('');
          setStep('enter');
          setConfirmPin('');
          onFailure?.();
        }
      }
    } else {
      onSuccess(pin);
    }
  }, [pin]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => { setShake(false); setError(''); }, 600);
  };

  const handleKey = (key: string) => {
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
    } else if (key && pin.length < maxLength) {
      setPin((p) => p + key);
    }
  };

  const displayTitle = title || (mode === 'set'
    ? step === 'enter' ? 'Set Your PIN' : 'Confirm Your PIN'
    : 'Enter PIN');

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl neon-gradient mx-auto mb-4 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{displayTitle}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'set' ? 'Create a 4-digit security PIN' : 'Enter your 4-digit PIN to continue'}
        </p>
      </motion.div>

      {/* PIN dots */}
      <motion.div animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}
        className="flex gap-4 mb-8">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
            i < pin.length
              ? 'bg-primary border-primary shadow-lg shadow-primary/30'
              : 'border-muted-foreground/30'
          }`.replace(/\s+/g, ' ') } />
        ))}
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-destructive text-xs mb-4">{error}</motion.p>
        )}
      </AnimatePresence>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {keys.map((key, i) => (
          <button key={i} onClick={() => handleKey(key)} disabled={key === ''}
            className={`h-16 rounded-2xl text-xl font-semibold transition-all active:scale-90 ${
              key === '' ? 'invisible' :
              key === 'del' ? 'text-muted-foreground hover:text-foreground hover:bg-secondary/50' :
              'text-foreground hover:bg-secondary/50 glass-card'
            }`.replace(/\s+/g, ' ')}>
            {key === 'del' ? <Delete className="w-6 h-6 mx-auto" /> : key}
          </button>
        ))}
      </div>

      {onCancel && (
        <button onClick={onCancel} className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </button>
      )}
    </div>
  );
};

export default PinLock;
