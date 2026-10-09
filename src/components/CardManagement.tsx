import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, Unlock, Eye, EyeOff, Copy, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const CardManagement = () => {
  const [frozen, setFrozen] = useState(false);
  const [showNumber, setShowNumber] = useState(false);

  const cardNumber = '4829 3710 5582 4829';
  const cvv = '847';

  const toggleFreeze = () => {
    setFrozen(!frozen);
    toast({
      title: frozen ? 'Card Unfrozen 🔀' : 'Card Frozen 🔂',
      description: frozen ? 'Your card is now active' : 'Your card has been frozen',
    });
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''));
    toast({ title: 'Copied!', description: 'Card number copied' });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Card Management</h2>
        <p className="text-sm text-muted-foreground">Manage your virtual debit card</p>
      </div>

      {/* Virtual Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-sm rounded-3xl relative overflow-hidden mx-auto transition-all ${frozen ? 'opacity-60 grayscale' : ''}`}
        style={{ aspectRatio: '1.6/1', background: 'linear-gradient(135deg, hsl(270 80% 30%), hsl(210 100% 40%))' }}>
        <div className="absolute inset-0 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-white/80 text-sm font-medium">StellarFlow</span>
            <CreditCard className="w-6 h-6 text-white/60" />
          </div>
          <div>
            <p className="text-white/60 text-xs mb-1">Card Number</p>
            <div className="flex items-center gap-2">
              <p className="text-white text-lg font-mono tracking-wider">
                {showNumber ? cardNumber : '•• •• •• • 4829'}
              </p>
              <button onClick={copyNumber} className="text-white/40 hover:text-white/70 transition-colors">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-white/60 text-[10px]">Card Holder</p>
              <p className="text-white text-sm font-medium">STELLAR USER</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-[10px]">Valid Thru</p>
              <p className="text-white text-sm font-medium">12/28</p>
            </div>
          </div>
        </div>
        {frozen && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2">
              <Lock className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">Card Frozen</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Card Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        <button onClick={toggleFreeze}
          className="glass-card p-3 flex flex-col items-center gap-1.5 hover:bg-secondary/50 transition-colors active:scale-95">
          {frozen ? <Unlock className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-destructive" />}
          <span className="text-[10px] font-medium text-foreground">{frozen ? 'Unfreeze' : 'Freeze'}</span>
        </button>
        <button onClick={() => setShowNumber(!showNumber)}
          className="glass-card p-3 flex flex-col items-center gap-1.5 hover:bg-secondary/50 transition-colors active:scale-95">
          {showNumber ? <EyeOff className="w-5 h-5 text-accent" /> : <Eye className="w-5 h-5 text-accent" />}
          <span className="text-[10px] font-medium text-foreground">{showNumber ? 'Hide' : 'Show'}</span>
        </button>
        <button className="glass-card p-3 flex flex-col items-center gap-1.5 hover:bg-secondary/50 transition-colors active:scale-95">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-medium text-foreground">Security</span>
        </button>
      </motion.div>

      {/* Card Details */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Card Details</h3>
        <div className="space-y-2">
          {[
            { label: 'Card Type', value: 'Virtual Debit' },
            { label: 'Network', value: 'Stellar Network' },
            { label: 'Currency', value: 'XLM / USDC' },
            { label: 'Status', value: frozen ? 'Frozen' : 'Active', color: frozen ? 'text-destructive' : 'text-primary' },
            { label: 'Daily Limit', value: '$5,000' },
          ].map(d => (
            <div key={d.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{d.label}</span>
              <span className={`font-medium ${(d as any).color || 'text-foreground'}`}>{d.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Card Transactions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Card Transactions</h3>
        <div className="space-y-2">
          {[
            { merchant: 'Amazon', amount: '-$42.50', date: 'Today' },
            { merchant: 'Spotify', amount: '-$9.99', date: 'Yesterday' },
            { merchant: 'Uber', amount: '-$18.30', date: 'Mar 28' },
          ].map(t => (
            <div key={t.merchant} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{t.merchant}</p>
                <p className="text-xs text-muted-foreground">{t.date}</p>
              </div>
              <span className="text-sm font-semibold text-destructive">{t.amount}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CardManagement;
