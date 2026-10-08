import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown, Loader2, CheckCircle2, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { usePin } from '@/hooks/usePin';
import { stellarApi } from '@/lib/stellarApi';
import ScheduledPayments from './ScheduledPayments';
import PinLock from './PinLock';

const ASSETS = ['XLM', 'USDC'];

const SendScreen = () => {
  const { wallet, refreshBalance } = useWallet();
  const { isPinSet, verifyPin } = usePin();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('XLM');
  const [memo, setMemo] = useState('');
  const [showAssets, setShowAssets] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [showPinVerify, setShowPinVerify] = useState(false);
  const [pendingPin, setPendingPin] = useState<string | null>(null);

  const handleSend = () => {
    if (!wallet) {
      toast({ title: 'No wallet', description: 'Create or import a wallet first', variant: 'destructive' });
      return;
    }
    if (!recipient || !amount) {
      toast({ title: 'Missing fields', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    if (parseFloat(amount) <= 0) {
      toast({ title: 'Invalid amount', description: 'Amount must be positive', variant: 'destructive' });
      return;
    }
    // If PIN is set, require verification first
    if (isPinSet) {
      setShowPinVerify(true);
    } else {
      setPendingPin(null);
      setShowConfirm(true);
    }
  };

  const handlePinSuccess = (pin: string) => {
    if (verifyPin(pin)) {
      setPendingPin(pin);
      setShowPinVerify(false);
      setShowConfirm(true);
    } else {
      toast({ title: 'Wrong PIN', description: 'Please try again', variant: 'destructive' });
    }
  };

  const confirmSend = async () => {
    if (!wallet) return;
    setSending(true);
    try {
      const result = await stellarApi.sendPayment({
        publicKey: wallet.publicKey,
        destination: recipient,
        amount,
        memo: memo || undefined,
        pin: pendingPin ?? undefined,
      });
      setTxHash(result.hash);
      setSent(true);
      await refreshBalance();
      toast({ title: 'Payment sent successfully! ✅', description: `You sent money across borders instantly.` });
      setTimeout(() => {
        setShowConfirm(false);
        setSent(false);
        setRecipient('');
        setAmount('');
        setMemo('');
        setTxHash('');
        setPendingPin(null);
      }, 2500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Transaction failed';
      toast({ title: 'Transaction failed', description: msg, variant: 'destructive' });
      setShowConfirm(false);
      setPendingPin(null);
    } finally {
      setSending(false);
    }
  };

  if (showPinVerify) {
    return <PinLock mode="verify" onSuccess={handlePinSuccess} onCancel={() => setShowPinVerify(false)} title="Confirm Payment" />;
  }

  return (
    <div className="px-4 pb-28 pt-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-foreground">Send Money</h1>
        <p className="text-sm text-muted-foreground">Transfer funds on Stellar {wallet ? 'Testnet' : ''}</p>
      </motion.div>

      {!wallet && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 text-center">
          <p className="text-sm text-muted-foreground">Create or import a wallet in the Profile tab to send payments.</p>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Recipient Address</label>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="G..."
            className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount</label>
          <div className="flex gap-2">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" type="number"
              className="flex-1 bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <button onClick={() => setShowAssets(!showAssets)}
              className="glass-card px-4 py-3 flex items-center gap-2 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors min-w-[90px] justify-center">
              {asset} <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          {showAssets && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="mt-2 glass-card p-2 space-y-1">
              {ASSETS.map((a) => (
                <button key={a} onClick={() => { setAsset(a); setShowAssets(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${a === asset ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary/50'}`>
                  {a}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Memo (optional)</label>
          <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Add a note..." maxLength={28}
            className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <button onClick={handleSend} disabled={!wallet}
          className="w-full neon-gradient text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-40">
          {isPinSet && <Shield className="w-4 h-4" />}
          <ArrowUpRight className="w-4 h-4" /> Send {asset}
        </button>

        {isPinSet && (
          <p className="text-[10px] text-muted-foreground text-center">🔒 PIN verification required before sending</p>
        )}
      </motion.div>

      {/* Storytelling */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="glass-card p-3 gradient-border text-center">
        <p className="text-[11px] text-muted-foreground italic">"No hidden fees. Powered by Stellar."</p>
      </motion.div>

      <ScheduledPayments />

      {/* Confirm Modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="glass-card border-border/50 max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {sent ? 'Transaction Sent! 🎉' : 'Confirm Transaction'}
            </DialogTitle>
          </DialogHeader>
          {sent ? (
            <div className="flex flex-col items-center py-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 className="w-16 h-16 text-primary" />
              </motion.div>
              <p className="text-sm text-foreground font-semibold mt-3">You sent money across borders instantly!</p>
              <p className="text-xs text-muted-foreground mt-1">No hidden fees. Powered by Stellar.</p>
              {txHash && (
                <p className="text-[10px] text-muted-foreground mt-2 font-mono break-all px-4 text-center">{txHash}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <span className="text-foreground font-mono text-xs truncate max-w-[180px]">{recipient}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-foreground font-semibold">{amount} {asset}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span className="text-primary text-xs">Stellar Testnet</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee</span>
                <span className="text-primary text-xs">~0.00001 XLM</span>
              </div>
              {memo && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Memo</span>
                  <span className="text-foreground text-xs">{memo}</span>
                </div>
              )}
            </div>
          )}
          {!sent && (
            <DialogFooter>
              <button onClick={confirmSend} disabled={sending}
                className="w-full neon-gradient text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                {sending ? <><span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending...</span></font> : 'Confirm & Send'}
              </button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SendScreen;
