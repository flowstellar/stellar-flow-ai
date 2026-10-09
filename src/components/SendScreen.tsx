import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown, Loader2, CheckCircle2, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { usePin } from '@/hooks/usePin';
import { stellarApi } from '@/lib/stellarApi';
import { MEMO_BYTE_LIMIT, getMemoByteLength, isMemoWithinLimit } from '@/lib/memo';
import { formatStroopsToXlm } from '@/lib/fee';
import ScheduledPayments from './ScheduledPayments';
import PinLock from './PinLock';

const ASSETS = ['XLM';
const MIN_ACCOUNT_BALANCE = 1;
const ASSETS = ['XLM', 'USDC'];

// Stellar MEMO_TEXT is limited to 28 UTF-8 bytes. We clamp by byte length
// (via TextEncoder) rather than by JS `String.length`, which counts UTF-16
// code units and is wrong for emoji.
const MEMO_BYTE_LIMIT = 28;

function truncateUtf8Bytes(value: string, maxBytes: number): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  if (bytes.length <= maxBytes) return value;

  let end = maxBytes;
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) {
    end--;
  }
  const lead = bytes[end];
  let sequenceLength = 1;
  if (lead >= 0xf0) sequenceLength = 4;
  else if (lead >= 0xe0) sequenceLength = 3;
  else if (lead >= 0xc0) sequenceLength = 2;
  if (end + sequenceLength > maxBytes) {
    end--;
  }
  return new TextDecoder().decode(bytes.subarray(0, end));
}

const BASE_RESERVE_XLM = 1;
const FEE_XLM = 0.00001;

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
  const [fee, setFee] = useState<string | null>(null);
  const [showPinVerify, setShowPinVerify] = useState(false);
  const [parsedAmount, setParsedAmount] = useState<number | null>(null);

  const nativeBalance = typeof wallet?.balance === 'number' ? wallet.balance : 0;
  const spendableBalance = Math.floor((nativeBalance - BASE_RESERVE_XLM - FEE_XLM) * 1e7) / 1e7;

  const memoByteLength = getMemoByteLength(memo);
  const memoTooLong = !isMemoWithinLimit(memo);

  const handleSend = () => {
    if (!wallet) {
      toast({ title: 'No wallet', description: 'Create or import a wallet first', variant: 'destructive' });
      return;
    }
    if (!recipient || !amount) {
      toast({ title: 'Missing fields', description: 'Please fill in all field', variant: 'destructive' });
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: 'Invalid amount', description: 'Amount must be positive', variant: 'destructive' });
      return;
    }
    // New accounts require at least the base reserve (1 XLM)
    if (amountNum < MIN_ACCOUNT_BALANCE) {
      toast({
        title: 'Amount below minimum',
        description: `New accounts must be funded with at least ${MIN_ACCOUNT_BALANCE} XLM. Please fund the account first or send at least ${MIN_ACCOUNT_BALANCE} XLM.`,
    if (spendableBalance > 0 && amountNum > spendableBalance) {
      toast({
        title: 'Insufficient balance',
        description: `Available amount: ${spendableBalance.toFixed(7)} XLM`,
        variant: 'destructive',
      });
      return;
    }
    // If PiN is set, require verification first
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast({ title: 'Invalid amount', description: 'Amount must be positive', variant: 'destructive' });
      return;
    }
    setParsedAmount(amountNum);
    // If PIN is set, require verification first
    if (memoTooLong) {
      toast({ title: 'Memo too long', description: `The memo must fit in ${MEMO_BYTE_LIMIT} UTF-8 bytes. Currently ${memoByteLength} bytes.`, variant: 'destructive' });
      return;
    }
    // If PiN is set, require verification first
    if (isPinSet) {
      setShowPinVerify(true);
    } else {
      setShowConfirm(true);
    }
  };

  const handlePinSuccess = (pin: string) => {
    if (verifyPin(pin)) {
      setShowPinVerify(false);
      setShowConfirm(true);
    } else {
      toast({ title: 'Wrong PIN', description: 'Please try again', variant: 'destructive' });
    }
  };

  const confirmSend = async () => {
    if (!wallet) return;
    const amountNum = parsedAmount !== null ? parsedAmount : Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast({ title: 'Invalid amount', description: 'Amount must be positive', variant: 'destructive' });
    if (memoTooLong) {
      toast({ title: 'Memo too long', description: `The memo must fit in ${MEMO_BYTE_LIMIT} UTF-8 bytes.`, variant: 'destructive' });
      setShowConfirm(false);
      return;
    }
    setSending(true);
    try {
      const result = await stellarApi.sendPayment({
        secretKey: wallet.secretKey,
        destination: recipient,
        amount: String(amountNum),
        memo: memo || undefined,
      });
      setTxHash(result.hash);
      setFee(result.fee);
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
        setParsedAmount(null);
        setFee(null);
      }, 2500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Transaction failed';
      toast({ title: 'Transaction failed', description: msg, variant: 'destructive' });
      setShowConfirm(false);
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
      )3

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-5 space-y-4">
        <div>
          <label htmlFor="send-recipient" className="text-xs font-medium text-muted-foreground mb-1.5 block">Recipient Address</label>
          <input id="send-recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="G..."
            className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
        </div>

        <div>
          <label htmlFor="send-amount" className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount</label>
          <div className="flex gap-2">
            <input id="send-amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" type="number"
              className="flex-1 bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <button onClick={() => setShowAssets(!showAssets)}
              className="glass-card px-4 py-3 flex items-center gap-2 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors min-w[90px] justify-center">
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
          <label htmlFor="send-memo" className="text-xs font-medium text-muted-foreground mb-1.5 block">Memo (optional)</label>
          <input id="send-memo" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Add a note..." maxLength={28}
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Memo (optional)</label>
          <input value={memo} onChange={(e) => setMemo(truncateUtf8Bytes(e.target.value, MEMO_BYTE_LIMIT))} placeholder="Add a note..."
            className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          <p className="text-[100] text-muted-foreground mt-1">Max ${MEMO_BYTE_LIMIT} bytes (emoji and non-Latin text count as multiple bytes)</p>
          <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Add a note..."
            aria-invalid={memoTooLong}
            aria-describedby={memo ? 'memo-counter' : undefined}
            className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 ${memoTooLong ? 'border-destructive focus:ring-destructive' : 'border-border/50 focus:ring-primary'}`} />
          {memo && (
            <div id="memo-counter" className="mt-1.5 flex items-center justify-between gap-2">
              <span className={`text-[10px] ${memoTooLong ? 'text-destructive' : 'text-muted-foreground'}`}>
                {memoTooLong
                  ? `Memo too long: ${memoByteLength}/${MEMO_BYTE_LIMIT} UTF-8 bytes`
                  : `${memoByteLength}/${MEMO_BYTE_LIMIT} bytes`}
              </span>
            </div>
          )}
        </div>

        <button onClick={handleSend} disabled={!wallet || memoTooLong}
          className="w-full neon-gradient text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-40">
          {isPinSet && <Shield className="w-4 h-4" />}
          <ArrowUpRight className="w-4 h-4" /> Send {asset}
        </button>

        {isPinSet && (
          <p className="text-[10px] text-muted-foreground text-center">🔂 PIN verification required before sending</p>
          <p className="text-[10px] text-muted-foreground text-center">🔔 PIN verification required before sending</p>
        )}
      </motion.div>

      {/* Storytelling */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="glass-card p-3 gradient-border text-center">
        <p className="text-[11px] text-muted-foreground italic">"No hidden fees. Powered by Stellar."</p>
      </motion.div>

      <ScheduledPayments />

      {/* Confirm Modal */}
      <Dialog open={showConfirm} onopenChange={setShowConfirm}>
        <DialogContent className="glass-card border-border/50 max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {sent ? 'Transaction Sent! 🎉' : 'Confirm Transaction'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {sent ? 'Your payment has been submitted to the Stellar network.' : 'Review the details below before confirming your payment.'}
            </DialogDescription>
          </DialogHeader>
          {sent ? (
            <div className="flex flex-col items-center py-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 className="w-16 h-16 text-primary" />
              </motion.div>
              <p className="text-sm text-foreground font-semibold mt-3">You sent money across borders instantly!</p>
              <p className="text-xs text-muted-foreground mt-1">No hidden fees. Powered by Stellar.</p>
              {fee !== null && (
                <p className="text-xs text-muted-foreground mt-1">Network Fee: {formatStroopsToXlm(fee)} XLM</p>
              )}
              {txHash && (
                <p className="text-[10px] text-muted-foreground mt-2 font-mono break-all px-4 text-center">{txHash.slice(0, 16)}...</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <span className="text-foreground font-mono texl-xs truncate max-w-[180px]">{recipient}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-foreground font-semibold">{parsedAmount !== null ? parsedAmount : amount} {asset}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span className="text-primary text-xs">Stellar Testnet</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee</span>
                <span className="text-primary texl-xs">~0.00001 XLM</span>
                <span className="text-muted-foreground">Network Fee</span>
                <span className="text-muted-foreground text-xs">Fee determined at submission</span>
              </div>
              {memo && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To</span>
                  <span className="text-foreground font-mono text-xs">{recipient.slice(0, 8)}...{recipient.slice(-4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-foreground font-semibold">{amount} {asset}</span>
                </div>
                {memo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Memo</span>
                    <span className="text-foreground">{memo}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {!sent && (
            <DialogFooter>
              <button onClick={confirmSend} disabled={sending || memoTooLong}
                className="w-full neon-gradient text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                {sending ? <<>Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Confirm & Send'}
                {sending ? <><span className="hidden"></span><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Confirm & Send'}
                {sending ? <<><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Confirm & Send'}
                {sending ? <><span className="hidden"></span><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Confirm & Send'}
          <DialogFooter>
            {!sent && (
              <button onClick={confirmSend} disabled={sending}
                className="w-full neon-gradient text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" /> Confirm Send
                  </>
                )}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SendScreen;
aW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7CmltcG9ydCB7IG1vdGlvbiB9IGZyb20gJ2ZyYW1lci1tb3Rpb24nOwppbXBvcnQgeyBBcnJvd1VwUmlnaHQsIENoZXZyb25Eb3duLCBMb2FkZXIyLCBDaGVja0NpcmNsZTIsIFNoaWVsZCB9IGZyb20gJ2x1Y2lkZS1yZWFjdCc7CmltcG9ydCB7IERpYWxvZywgRGlhbG9nQ29udGVudCwgRGlhbG9nSGVhZGVyLCBEaWFsb2dUaXRsZSwgRGlhbG9nRm9vdGVyIH0gZnJvbSAnQC9jb21wb25lbnRzL3VpL2RpYWxvZyc7CmltcG9ydCB7IHRvYXN0IH0gZnJvbSAnQC9ob29rcy91c2UtdG9hc3QnOwppbXBvcnQgeyB1c2VXYWxsZXQgfSBmcm9tICdAL2hvb2tzL3VzZVdhbGxldCc7CmltcG9ydCB7IHVzZVBpbiB9IGZyb20gJ0AvaG9va3MvdXNlUGluJzsKaW1wb3J0IHsgc3RlbGxhckFwaSB9IGZyb20gJ0AvbGliL3N0ZWxsYXJBcGknOwppbXBvcnQgeyBpc1ZhbGlkUmVjaXBpZW50QWRkcmVzcyB9IGZyb20gJ0AvbGliL3N0ZWxsYXJBZGRyZXNzJzsKaW1wb3J0IFNjaGVkdWxlZFBheW1lbnRzIGZyb20gJy4vU2NoZWR1bGVkUGF5bWVudHMnOwppbXBvcnQgUGluTG9jayBmcm9tICcuL1BpbkxvY2snOwoKY29uc3QgQVNTRVRTID0gWydYTE0nXTsKCmNvbnN0IFNlbmRTY3JlZW4gPSAoKSA9PiB7CiAgY29uc3QgeyB3YWxsZXQsIHJlZnJlc2hCYWxhbmNlIH0gPSB1c2VXYWxsZXQoKTsKICBjb25zdCB7IGlzUGluU2V0LCB2ZXJpZnlQaW4gfSA9IHVzZVBpbigpOwogIGNvbnN0IFtyZWNpcGllbnQsIHNldFJlY2lwaWVudF0gPSB1c2VTdGF0ZSgnJyk7CiAgY29uc3QgW2Ftb3VudCwgc2V0QW1vdW50XSA9IHVzZVN0YXRlKCcnKTsKICBjb25zdCBbYXNzZXQsIHNldEFzc2V0XSA9IHVzZVN0YXRlKCdYTE0nKTsKICBjb25zdCBbbWVtbywgc2V0TWVtb10gPSB1c2VTdGF0ZSgnJyk7CiAgY29uc3QgW3Nob3dBc3NldHMsIHNldFNob3dBc3NldHNdID0gdXNlU3RhdGUoZmFsc2UpOwogIGNvbnN0IFtzaG93Q29uZmlybSwgc2V0U2hvd0NvbmZpcm1dID0gdXNlU3RhdGUoZmFsc2UpOwogIGNvbnN0IFtzZW5kaW5nLCBzZXRTZW5kaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTsKICBjb25zdCBbc2VudCwgc2V0U2VudF0gPSB1c2VTdGF0ZShmYWxzZSk7CiAgY29uc3QgW3R4SGFzaCwgc2V0VHhIYXNoXSA9IHVzZVN0YXRlKCcnKTsKICBjb25zdCBbc2hvd1BpblZlcmlmeSwgc2V0U2hvd1BpblZlcmlmeV0gPSB1c2VTdGF0ZShmYWxzZSk7CiAgY29uc3QgW3JlY2lwaWVudEVycm9yLCBzZXRSZWNpcGllbnRFcnJvcl0gPSB1c2VTdGF0ZSgnJyk7CgogIGNvbnN0IGhhbmRsZVNlbmQgPSAoKSA9PiB7CiAgICBpZiAoIXdhbGxldCkgewogICAgICB0b2FzdCh7IHRpdGxlOiAnTm8gd2FsbGV0JywgZGVzY3JpcHRpb246ICdDcmVhdGUgb3IgaW1wb3J0IGEgd2FsbGV0IGZpcnN0JywgdmFyaWFudDogJ2Rlc3RydWN0aXZlJyB9KTsKICAgICAgcmV0dXJuOwogICAgfQogICAgaWYgKCFyZWNpcGllbnQgfHwgIWFtb3VudCkgewogICAgICB0b2FzdCh7IHRpdGxlOiAnTWlzc2luZyBmaWVsZHMnLCBkZXNjcmlwdGlvbjogJ1BsZWFzZSBmaWxsIGluIGFsbCBmaWVsZHMnLCB2YXJpYW50OiAnZGVzdHJ1Y3RpdmUnIH0pOwogICAgICByZXR1cm47CiAgICB9CiAgICBpZiAoIWlzVmFsaWRSZWNpcGllbnRBZGRyZXNzKHJlY2lwaWVudCkpIHsKICAgICAgc2V0UmVjaXBpZW50RXJyb3IoJ0VudGVyIGEgdmFsaWQgU3RlbGxhciBhZGRyZXNzIChH4oCmIDU2IGNoYXJhY3RlcnMpJyk7CiAgICAgIHJldHVybjsKICAgIH0KICAgIHNldFJlY2lwaWVudEVycm9yKCcnKTsKICAgIGlmIChwYXJzZUZsb2F0KGFtb3VudCkgPD0gMCkgewogICAgICB0b2FzdCh7IHRpdGxlOiAnSW52YWxpZCBhbW91bnQnLCBkZXNjcmlwdGlvbjogJ0Ftb3VudCBtdXN0IGJlIHBvc2l0aXZlJywgdmFyaWFudDogJ2Rlc3RydWN0aXZlJyB9KTsKICAgICAgcmV0dXJuOwogICAgfQogICAgLy8gSWYgUElOIGlzIHNldCwgcmVxdWlyZSB2ZXJpZmljYXRpb24gZmlyc3QKICAgIGlmIChpc1BpblNldCkgewogICAgICBzZXRTaG93UGluVmVyaWZ5KHRydWUpOwogICAgfSBlbHNlIHsKICAgICAgc2V0U2hvd0NvbmZpcm0odHJ1ZSk7CiAgICB9CiAgfTsKCiAgY29uc3QgaGFuZGxlUGluU3VjY2VzcyA9IChwaW46IHN0cmluZykgPT4gewogICAgaWYgKHZlcmlmeVBpbihwaW4pKSB7CiAgICAgIHNldFNob3dQaW5WZXJpZnkoZmFsc2UpOwogICAgICBzZXRTaG93Q29uZmlybSh0cnVlKTsKICAgIH0gZWxzZSB7CiAgICAgIHRvYXN0KHsgdGl0bGU6ICdXcm9uZyBQSU4nLCBkZXNjcmlwdGlvbjogJ1BsZWFzZSB0cnkgYWdhaW4nLCB2YXJpYW50OiAnZGVzdHJ1Y3RpdmUnIH0pOwogICAgfQogIH07CgogIGNvbnN0IGNvbmZpcm1TZW5kID0gYXN5bmMgKCkgPT4gewogICAgaWYgKCF3YWxsZXQpIHJldHVybjsKICAgIHNldFNlbmRpbmcodHJ1ZSk7CiAgICB0cnkgewogICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzdGVsbGFyQXBpLnNlbmRQYXltZW50KHsKICAgICAgICBzZWNyZXRLZXk6IHdhbGxldC5zZWNyZXRLZXksCiAgICAgICAgZGVzdGluYXRpb246IHJlY2lwaWVudCwKICAgICAgICBhbW91bnQsCiAgICAgICAgbWVtbyB8fCB1bmRlZmluZWQsCiAgICAgIH0pOwogICAgICBzZXRUeEhhc2gocmVzdWx0Lmhhc2gpOwogICAgICBzZXRTZW50KHRydWUpOwogICAgICBhd2FpdCByZWZyZXNoQmFsYW5jZSgpOwogICAgICB0b2FzdCh7IHRpdGxlOiAnUGF5bWVudCBzZW50IHN1Y2Nlc3NmdWxseSEg4pyFJywgZGVzY3JpcHRpb246IGBZb3Ugc2VudCBtb25leSBhY3Jvc3MgYm9yZGVycyBpbnN0YW50bHkuYCB9KTsKICAgICAgc2V0VGltZW91dCgoKSA9PiB7CiAgICAgICAgc2V0U2hvd0NvbmZpcm0oZmFsc2UpOwogICAgICAgIHNldFNlbnQoZmFsc2UpOwogICAgICAgIHNldFJlY2lwaWVudCgnJyk7CiAgICAgICAgc2V0QW1vdW50KCcnKTsKICAgICAgICBzZXRNZW1vKCcnKTsKICAgICAgICBzZXRUeEhhc2goJycpOwogICAgICB9LCAyNTAwKTsKICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgIGNvbnN0IG1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1RyYW5zYWN0aW9uIGZhaWxlZCc7CiAgICAgIHRvYXN0KHsgdGl0bGU6ICdUcmFuc2FjdGlvbiBmYWlsZWQnLCBkZXNjcmlwdGlvbjogbXNnLCB2YXJpYW50OiAnZGVzdHJ1Y3RpdmUnIH0pOwogICAgICBzZXRTaG93Q29uZmlybShmYWxzZSk7CiAgICB9IGZpbmFsbHkgewogICAgICBzZXRTZW5kaW5nKGZhbHNlKTsKICAgIH0KICB9OwoKICBpZiAoc2hvd1BpblZlcmlmeSkgewogICAgcmV0dXJuIDxQaW5Mb2NrIG1vZGU9InZlcmlmeSIgb25TdWNjZXNzPXtoYW5kbGVQaW5TdWNjZXNzfSBvbkNhbmNlbD17KCkgPT4gc2V0U2hvd1BpblZlcmlmeShmYWxzZSl9IHRpdGxlPSJDb25maXJtIFBheW1lbnQiIC8+OwogIH0KCiAgcmV0dXJuICgKICAgIDxkaXYgY2xhc3NOYW1lPSJweC00IHBiLTI4IHB0LTYgc3BhY2UteS01Ij4KICAgICAgPG1vdGlvbi5kaXYgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAtMTAgfX0gYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB5OiAwIH19PgogICAgICAgIDxoMSBjbGFzc05hbWU9InRleHQteGwgZm9udC1ib2xkIHRleHQtZm9yZWdyb3VuZCI+U2VuZCBNb25leTwvaDE+CiAgICAgICAgPHAgY2xhc3NOYW1lPSJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCI+VHJhbnNmZXIgZnVuZHMgb24gU3RlbGxhciB7d2FsbGV0ID8gJ1Rlc3RuZXQnIDogJyd9PC9wPgogICAgICA8L21vdGlvbi5kaXY+CgogICAgICB7IXdhbGxldCAmJiAoCiAgICAgICAgPG1vdGlvbi5kaXYgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAyMCB9fSBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX0KICAgICAgICAgIGNsYXNzTmFtZT0iZ2xhc3MtY2FyZCBwLTUgdGV4dC1jZW50ZXIiPgogICAgICAgICAgPHAgY2xhc3NOYW1lPSJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCI+Q3JlYXRlIG9yIGltcG9ydCBhIHdhbGxldCBpbiB0aGUgUHJvZmlsZSB0YWIgdG8gc2VuZCBwYXltZW50cy48L3A+CiAgICAgICAgPC9tb3Rpb24uZGl2PgogICAgICApfQoKICAgICAgPG1vdGlvbi5kaXYgaW5pdGlhbD17eyBvcGFjaXR5OiAwLCB5OiAyMCB9fSBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX0gdHJhbnNpdGlvbj17eyBkZWxheTogMC4xIH19CiAgICAgICAgY2xhc3NOYW1lPSJnbGFzcy1jYXJkIHAtNSBzcGFjZS15LTQiPgogICAgICAgIDxkaXY+CiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSJ0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtYi0xLjUgYmxvY2siPlJlY2lwaWVudCBBZGRyZXNzPC9sYWJlbD4KICAgICAgICAgIDxpbnB1dCB2YWx1ZT17cmVjaXBpZW50fQogICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHsKICAgICAgICAgICAgICBzZXRSZWNpcGllbnQoZS50YXJnZXQudmFsdWUpOwogICAgICAgICAgICAgIGlmIChyZWNpcGllbnRFcnJvcikgc2V0UmVjaXBpZW50RXJyb3IoJycpOwogICAgICAgICAgICB9fQogICAgICAgICAgICBwbGFjZWhvbGRlcj0iRy4uLiIKICAgICAgICAgICAgYXJpYS1pbnZhbGlkPXshIXJlY2lwaWVudEVycm9yfQogICAgICAgICAgICBjbGFzc05hbWU9e2B3LWZ1bGwgYmctc2Vjb25kYXJ5LzUwIGJvcmRlciByb3VuZGVkLXhsIHB4LTQgcHktMyB0ZXh0LXNtIHRleHQtZm9yZWdyb3VuZCBwbGFjZWhvbGRlcjp0ZXh0LW11dGVkLWZvcmVncm91bmQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMSBmb250LW1vbm8gJHtyZWNpcGllbnRFcnJvciA/ICdib3JkZXItZGVzdHJ1Y3RpdmUgZm9jdXM6cmluZy1kZXN0cnVjdGl2ZScgOiAnYm9yZGVyLWJvcmRlci81MCBmb2N1czpyaW5nLXByaW1hcnknfWAu dHJpbSgpfQogICAgICAgICAgLz4KICAgICAgICAgIHtyZWNpcGllbnRFcnJvciAmJiAoCiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT0idGV4dC1beHNdIHRleHQtZGVzdHJ1Y3RpdmUgbXQtMS41Ij57cmVjaXBpZW50RXJyb3J9PC9wPgogICAgICAgICAgKX0KICAgICAgICA8L2Rpdj4KCiAgICAgICAgPGRpdj4KICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9InRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG1iLTEuNSBibG9jayI+QW1vdW50PC9sYWJlbD4KICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSJmbGV4IGdhcC0yIj4KICAgICAgICAgICAgPGlucHV0IHZhbHVlPXthbW91bnR9IG9uQ2hhbmdlPXsoZSkgPT4gc2V0QW1vdW50KGUudGFyZ2V0LnZhbHVlKX0gcGxhY2Vob2xkZXI9IjAuMDAiIHR5cGU9Im51bWJlciIKICAgICAgICAgICAgICBjbGFzc05hbWU9ImZsZXgtMSBiZy1zZWNvbmRhcnkvNTAgYm9yZGVyIGJvcmRlci1ib3JkZXIvNTAgcm91bmRlZC14bCBweC00IHB5LTMgdGV4dC1zbSB0ZXh0LWZvcmVncm91bmQgcGxhY2Vob2xkZXI6dGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1wcmltYXJ5IiAvPgogICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldFNob3dBc3NldHMoIXNob3dBc3NldHMpfQogICAgICAgICAgICAgIGNsYXNzTmFtZT0iZ2xhc3MtY2FyZCBweC00IHB5LTMgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWZvcmVncm91bmQgaG92ZXI6Ymctc2Vjb25kYXJ5LzUwIHRyYW5zaXRpb24tY29sb3JzIG1pbi13LVs5MHB4XSBqdXN0aWZ5LWNlbnRlciI+CiAgICAgICAgICAgICAge2Fzc2V0fSA8Q2hldnJvbkRvd24gY2xhc3NOYW1lPSJ3LTMgaC0zIiAvPgogICAgICAgICAgICA8L2J1dHRvbj4KICAgICAgICAgIDwvZGl2PgogICAgICAgICAge3Nob3dBc3NldHMgJiYgKAogICAgICAgICAgICA8bW90aW9uLmRpdiBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IC01IH19IGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fQogICAgICAgICAgICAgIGNsYXNzTmFtZT0ibXQtMiBnbGFzcy1jYXJkIHAtMiBzcGFjZS15LTEiPgogICAgICAgICAgICAgIHtBU1NFVFMubWFwKChhKSA9PiAoCiAgICAgICAgICAgICAgICA8YnV0dG9uIGtleT17YX0gb25DbGljaz17KCkgPT4geyBzZXRBc3NldChhKTsgc2V0U2hvd0Fzc2V0cyhmYWxzZSk7IH19CiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCB0ZXh0LWxlZnQgcHgtMyBweS0yIHJvdW5kZWQtbGcgdGV4dC1zbSB0cmFuc2l0aW9uLWNvbG9ycyAke2EgPT09IGFzc2V0ID8gJ2JnLXByaW1hcnkvMTAgdGV4dC1wcmltYXJ5JyA6ICd0ZXh0LWZvcmVncm91bmQgaG92ZXI6Ymctc2Vjb25kYXJ5LzUwJ31gfT4KICAgICAgICAgICAgICAgICAge2F9CiAgICAgICAgICAgICAgICA8L2J1dHRvbj4KICAgICAgICAgICAgICApKX0KICAgICAgICAgICAgPC9tb3Rpb24uZGl2PgogICAgICAgICAgKX0KICAgICAgICA8L2Rpdj4KCiAgICAgICAgPGRpdj4KICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9InRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG1iLTEuNSBibG9jayI+TWVtbyAob3B0aW9uYWwpPC9sYWJlbD4KICAgICAgICAgIDxpbnB1dCB2YWx1ZT17bWVtb30gb25DaGFuZ2U9eyhlKSA9PiBzZXRNZW1vKGUudGFyZ2V0LnZhbHVlKX0gcGxhY2Vob2xkZXI9IkFkZCBhIG5vdGUuLi4iIG1heExlbmd0aD17Mjh9CiAgICAgICAgICAgIGNsYXNzTmFtZT0idy1mdWxsIGJnLXNlY29uZGFyeS81MCBib3JkZXIgYm9yZGVyLWJvcmRlci81MCByb3VuZGVkLXhsIHB4LTQgcHktMyB0ZXh0LXNtIHRleHQtZm9yZWdyb3VuZCBwbGFjZWhvbGRlcjp0ZXh0LW11dGVkLWZvcmVncm91bmQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLXByaW1hcnkiIC8+CiAgICAgICAgPC9kaXY+CgogICAgICAgIDxidXR0b24gb25DbGljaz17aGFuZGxlU2VuZH0gZGlzYWJsZWQ9eyF3YWxsZXR9CiAgICAgICAgICBjbGFzc05hbWU9InctZnVsbCBuZW9uLWdyYWRpZW50IHRleHQtcHJpbWFyeS1mb3JlZ3JvdW5kIGZvbnQtc2VtaWJvbGQgcHktMyByb3VuZGVkLXhsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0yIGhvdmVyOm9wYWNpdHktOTAgdHJhbnNpdGlvbi1vcGFjaXR5IGFjdGl2ZTpzY2FsZS1bMC45OF0gZGlzYWJsZWQ6b3BhY2l0eS00MCI+CiAgICAgICAgICB7aXNQaW5TZXQgJiYgPFNoaWVsZCBjbGFzc05hbWU9InctNCBoLTQiIC8+fQogICAgICAgICAgPEFycm93VXBSaWdodCBjbGFzc05hbWU9InctNCBoLTQiIC8+IFNlbmQge2Fzc2V0fQogICAgICAgIDwvYnV0dG9uPgoKICAgICAgICB7aXNQaW5TZXQgJiYgKAogICAgICAgICAgPHAgY2xhc3NOYW1lPSJ0ZXh0LVsxMHB4XSB0ZXh0LW11dGVkLWZvcmVncm91bmQgdGV4dC1jZW50ZXIiPvCflIIgUElOIHZlcmlmaWNhdGlvbiByZXF1aXJlZCBiZWZvcmUgc2VuZGluZzwvcD4KICAgICAgICApfQogICAgICA8L21vdGlvbi5kaXY+CgogICAgICB7LyogU3Rvcnl0ZWxsaW5nICovfQogICAgICA8bW90aW9uLmRpdiBpbml0aWFsPXt7IG9wYWNpdHk6IDAgfX0gYW5pbWF0ZT17eyBvcGFjaXR5OiAxIH19IHRyYW5zaXRpb249e3sgZGVsYXk6IDAuMiB9fQogICAgICAgIGNsYXNzTmFtZT0iZ2xhc3MtY2FyZCBwLTMgZ3JhZGllbnQtYm9yZGVyIHRleHQtY2VudGVyIj4KICAgICAgICA8cCBjbGFzc05hbWU9InRleHQtWzExcHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBpdGFsaWMiPiJObyBoaWRkZW4gZmVlcy4gUG93ZXJlZCBieSBTdGVsbGFyLiI8L3A+CiAgICAgIDwvbW90aW9uLmRpdj4KCiAgICAgIDxTY2hlZHVsZWRQYXltZW50cyAvPgoKICAgICAgey8qIENvbmZpcm0gTW9kYWwgKi99CiAgICAgIDxEaWFsb2cgb3Blbj17c2hvd0NvbmZpcm19IG9uT3BlbkNoYW5nZT17c2V0U2hvd0NvbmZpcm19PgogICAgICAgIDxEaWFsb2dDb250ZW50IGNsYXNzTmFtZT0iZ2xhc3MtY2FyZCBib3JkZXItYm9yZGVyLzUwIG1heC13LXNtIG14LWF1dG8iPgogICAgICAgICAgPERpYWxvZ0hlYWRlcj4KICAgICAgICAgICAgPERpYWxvZ1RpdGxlIGNsYXNzTmFtZT0idGV4dC1mb3JlZ3JvdW5kIj4KICAgICAgICAgICAgICB7c2VudCA/ICdUcmFuc2FjdGlvbiBTZW50ISDwn46JJyA6ICdDb25maXJtIFRyYW5zYWN0aW9uJ30KICAgICAgICAgICAgPC9EaWFsb2dUaXRsZT4KICAgICAgICAgIDwvRGlhbG9nSGVhZGVyPgogICAgICAgICAge3NlbnQgPyAoCiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSJmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBweS02Ij4KICAgICAgICAgICAgICA8bW90aW9uLmRpdiBpbml0aWFsPXt7IHNjYWxlOiAwIH19IGFuaW1hdGU9e3sgc2NhbGU6IDEgfX0+CiAgICAgICAgICAgICAgICA8Q2hlY2tDaXJjbGUyIGNsYXNzTmFtZT0idy0xNiBoLTE2IHRleHQtcHJpbWFyeSIgLz4KICAgICAgICAgICAgICA8L21vdGlvbi5kaXY+CiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPSJ0ZXh0LXNtIHRleHQtZm9yZWdyb3VuZCBmb250LXNlbWlib2xkIG10LTMiPllvdSBzZW50IG1vbmV5IGFjcm9zcyBib3JkZXJzIGluc3RhbnRseSE8L3A+CiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPSJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtdC0xIj5ObyBoaWRkZW4gZmVlcy4gUG93ZXJlZCBieSBTdGVsbGFyLjwvcD4KICAgICAgICAgICAgICB7dHhIYXNoICYmICgKICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT0idGV4dC1bMTBweF0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG10LTIgZm9udC1tb25vIGJyZWFrLWFsbCBweC00IHRleHQtY2VudGVyIj57dHhIYXNofTwvcD4KICAgICAgICAgICAgICApfQogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICkgOiAoCiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSJzcGFjZS15LTMgcHktMiI+CiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9ImZsZXgganVzdGlmeS1iZXR3ZWVuIHRleHQtc20iPgogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSJ0ZXh0LW11dGVkLWZvcmVncm91bmQiPlRvPC9zcGFuPgogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSJ0ZXh0LWZvcmVncm91bmQgZm9udC1tb25vIHRleHQteHMgdHJ1bmNhdGUgbWF4LXctWzE4MHB4XSI+e3JlY2lwaWVudH08L3NwYW4+CiAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9ImZsZXgganVzdGlmeS1iZXR3ZWVuIHRleHQtc20iPgogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSJ0ZXh0LW11dGVkLWZvcmVncm91bmQiPkFtb3VudDwvc3Bhbj4KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0idGV4dC1mb3JlZ3JvdW5kIGZvbnQtc2VtaWJvbGQiPnthbW91bnR9IHthc3NldH08L3NwYW4+CiAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9ImZsZXgganVzdGlmeS1iZXR3ZWVuIHRleHQtc20iPgogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSJ0ZXh0LW11dGVkLWZvcmVncm91bmQiPk5ldHdvcms8L3NwYW4+CiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9InRleHQtcHJpbWFyeSB0ZXh0LXhzIj5TdGVsbGFyIFRlc3RuZXQ8L3NwYW4+CiAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9ImZsZXgganVzdGlmeS1iZXR3ZWVuIHRleHQtc20iPgogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSJ0ZXh0LW11dGVkLWZvcmVncm91bmQiPkZlZTwvc3Bhbj4KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0idGV4dC1wcmltYXJ5IHRleHQteHMiPn4wLjAwMDAxIFhMTTwvc3Bhbj4KICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICB7bWVtbyAmJiAoCiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0iZmxleCBqdXN0aWZ5LWJldHdlZW4gdGV4dC1zbSI+CiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0idGV4dC1tdXRlZC1mb3JlZ3JvdW5kIj5NZW1vPC9zcGFuPgogICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9InRleHQtZm9yZWdyb3VuZCB0ZXh0LXhzIj57bWVtb308L3NwYW4+CiAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICApfQogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICl9CiAgICAgICAgICB7IXNlbnQgJiYgKAogICAgICAgICAgICA8RGlhbG9nRm9vdGVyPgogICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17Y29uZmlybVNlbmR9IGRpc2FibGVkPXtzZW5kaW5nfQogICAgICAgICAgICAgICAgY2xhc3NOYW1lPSJ3LWZ1bGwgbmVvbi1ncmFkaWVudCB0ZXh0LXByaW1hcnktZm9yZWdyb3VuZCBmb250LXNlbWlib2xkIHB5LTMgcm91bmRlZC14bCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMiBkaXNhYmxlZDpvcGFjaXR5LTUwIj4KICAgICAgICAgICAgICAgIHtzZW5kaW5nID8gPD48TG9hZGVyMiBjbGFzc05hbWU9InctNCBoLTQgYW5pbWF0ZS1zcGluIiAvPiBTZW5kaW5nLi4uPC8+IDogJ0NvbmZpcm0gJiBTZW5kJ30KICAgICAgICAgICAgICA8L2J1dHRvbj4KICAgICAgICAgICAgPC9EaWFsb2dGb290ZXI+CiAgICAgICAgICApfQogICAgICAgIDwvRGlhbG9nQ29udGVudD4KICAgICAgPC9EaWFsb2c+CiAgICA8L2Rpdj4KICApOwp9OwoKZXhwb3J0IGRlZmF1bHQgU2VuZFNjcmVlbjsK