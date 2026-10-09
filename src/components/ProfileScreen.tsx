import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, LogOut, Key, Shield, ChevronRight, Wallet, Loader2, Lock, Unlock } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { usePin } from '@/hooks/usePin';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PinLock from './PinLock';

const ProfileScreen = () => {
  const { wallet, balance, loading, createWallet, importWallet, logout } = useWallet();
  const { isPinSet, isLocked, setPin, lockWallet, clearPin } = usePin();
  const [showImport, setShowImport] = useState(false);
  const [importKey, setImportKey] = useState('');
  const [showSetPin, setShowSetPin] = useState(false);

  const copyAddress = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.publicKey);
    toast({ title: 'Copied!', description: 'Wallet address copied to clipboard' });
  };

  const handleCreate = async () => {
    try {
      await createWallet();
      toast({ title: 'Wallet Created! 🎉', description: 'Funded with testnet XLM via Friendbot' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create wallet';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleImport = async () => {
    if (!importKey.trim()) {
      toast({ title: 'Missing key', description: 'Enter your secret key', variant: 'destructive' });
      return;
    }
    try {
      await importWallet(importKey.trim());
      setShowImport(false);
      setImportKey('');
      toast({ title: 'Wallet Imported! ✅', description: 'Your wallet is ready' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to import wallet';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    logout();
    clearPin();
    toast({ title: 'Logged out', description: 'Wallet disconnected' });
  };

  const handlePinSet = (pin: string) => {
    setPin(pin);
    setShowSetPin(false);
    toast({ title: 'PIN Set! 🔒', description: 'Your wallet is now secured' });
  };

  if (showSetPin) {
    return <PinLock mode="set" onSuccess={handlePinSet} onCancel={() => setShowSetPin(false)} />;
  }

  const rateUnavailable = balance?.rateUnavailable === true || !balance?.usdValue;
  const usdValue = balance?.usdValue ?? null;

  return (
    <div className="px-4 pb-28 pt-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your wallet & settings</p>
      </motion.div>

      {/* Wallet Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-5 glow-blue relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent/5 blur-3xl" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl neon-gradient flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Stellar Wallet</p>
            {wallet ? (
              <p className="text-xs text-primary">Connected • Testnet</p>
            ) : (
              <p className="text-xs text-muted-foreground">Not connected</p>
            )}
          </div>
        </div>
        {wallet ? (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Public Key</p>
            <button onClick={copyAddress}
              className="w-full bg-secondary/50 rounded-xl p-3 flex items-center justify-between hover:bg-secondary/70 transition-colors">
              <span className="font-mono text-[10px] text-foreground truncate">{wallet.publicKey}</span>
              <Copy className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            </button>
            {balance && (
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Balance</span>
                <span className="text-foreground font-semibold">{balance.xlmBalance} XLM</span>
              </div>
            )}
            {balance && (
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">USD Value</span>
                {rateUnavailable ? (
                  <span className="text-destructive font-medium">Rate unavailable</span>
                ) : (
                  <span className="text-foreground font-medium">≈ {usdValue}</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Create or import a wallet to get started</p>
        )}
      </motion.div>

      {/* Wallet Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground mb-2">Wallet</h3>
        <button onClick={handleCreate} disabled={loading}
          className="w-full glass-card p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors disabled:opacity-50">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            {loading ? <Loader2 className="w-4 h-4 text-accent animate-spin" /> : <Key className="w-4 h-4 text-accent" />}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">Create New Wallet</p>
            <p className="text-xs text-muted-foreground">Generate keypair & fund on testnet</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={() => setShowImport(true)} disabled={loading}
          className="w-full glass-card p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors disabled:opacity-50">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            <Download className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">Import Wallet</p>
            <p className="text-xs text-muted-foreground">Import with Stellar secret key</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground mb-2">Security</h3>
        <button onClick={() => setShowSetPin(true)}
          className="w-full glass-card p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">{isPinSet ? 'Change PIN' : 'Set PIN Lock'}</p>
            <p className="text-xs text-muted-foreground">{isPinSet ? 'PIN is active' : '4-digit security PIN'}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        {wallet && isPinSet && (
          <button onClick={lockWallet}
            className="w-full glass-card p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Lock className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Lock Wallet</p>
              <p className="text-xs text-muted-foreground">Require PIN to access</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </motion.div>

      {/* Logout */}
      {wallet && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <button onClick={handleLogout}
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Disconnect Wallet</span>
          </button>
        </motion.div>
      )}

      <div className="text-center py-4">
        <span className="text-xs text-muted-foreground">Powered by <span className="neon-gradient-text font-semibold">Stellar</span> ⚡</span>
      </div>

      {/* Import Modal */}
      <Dialog open={showImport} onopenChange={setShowImport}>
        <DialogContent className="glass-card border-border/5 max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Import Wallet</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Enter your Stellar secret key to import an existing wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label htmlFor="import-secret-key" className="text-xs font-medium text-muted-foreground mb-1.5 block">Secret Key</label>
              <input id="import-secret-key" value={importKey} onChange={(e) => setImportKey(e.target.value)} placeholder="S..."
                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
              <p className="text-[10px] text-muted-foreground mt-1">Your secret key starts with 'S' and is 56 characters long</p>
            </div>
            <button onClick={handleImport} disabled={loading}
              className="w-full neon-gradient text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <<><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : 'Import Wallet'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileScreen;
aW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7CmltcG9ydCB7IG1vdGlvbiB9IGZyb20gJ2ZyYW1lci1tb3Rpb24nOwppbXBvcnQgeyBDb3B5LCBEb3dubG9hZCwgTG9nT3V0LCBLZXksIFNoaWVsZCwgQ2hldnJvblJpZ2h0LCBXYWxsZXQsIExvYWRlcjIsIExvY2ssIFVubG9jayB9IGZyb20gJ2x1Y2lkZS1yZWFjdCc7CmltcG9ydCB7IHVzZVdhbGxldCB9IGZyb20gJ0AvaG9va3MvdXNlV2FsbGV0JzsKaW1wb3J0IHsgdXNlUGluIH0gZnJvbSAnQC9ob29rcy91c2VQaW4nOwppbXBvcnQgeyB0b2FzdCB9IGZyb20gJ0AvaG9va3MvdXNlLXRvYXN0JzsKaW1wb3J0IHsgRGlhbG9nLCBEaWFsb2dDb250ZW50LCBEaWFsb2dIZWFkZXIsIERpYWxvZ1RpdGxlIH0gZnJvbSAnQC9jb21wb25lbnRzL3VpL2RpYWxvZyc7CmltcG9ydCBQaW5Mb2NrIGZyb20gJy4vUGluTG9jayc7Cgpjb25zdCBQcm9maWxlU2NyZWVuID0gKCkgPT4gewogIGNvbnN0IHsgd2FsbGV0LCBiYWxhbmNlLCBsb2FkaW5nLCBjcmVhdGVXYWxsZXQsIGltcG9ydFdhbGxldCwgbG9nb3V0IH0gPSB1c2VXYWxsZXQoKTsKICBjb25zdCB7IGlzUGluU2V0LCBpc0xvY2tlZCwgc2V0UGluLCBsb2NrV2FsbGV0LCBjbGVhclBpbiB9ID0gdXNlUGluKCk7CiAgY29uc3QgW3Nob3dJbXBvcnQsIHNldFNob3dJbXBvcnRdID0gdXNlU3RhdGUoZmFsc2UpOwogIGNvbnN0IFtpbXBvcnRLZXksIHNldEltcG9ydEtleV0gPSB1c2VTdGF0ZSgnJyk7CiAgY29uc3QgW3Nob3dTZXRQaW4sIHNldFNob3dTZXRQaW5dID0gdXNlU3RhdGUoZmFsc2UpOwoKICBjb25zdCBjb3B5QWRkcmVzcyA9ICgpID0+IHsKICAgIGlmICghd2FsbGV0KSByZXR1cm47CiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh3YWxsZXQucHVibGljS2V5KTsKICAgIHRvYXN0KHsgdGl0bGU6ICdDb3BpZWQhJywgZGVzY3JpcHRpb246ICdXYWxsZXQgYWRkcmVzcyBjb3BpZWQgdG8gY2xpcGJvYXJkJyB9KTsKICB9OwoKICBjb25zdCBoYW5kbGVDcmVhdGUgPSBhc3luYyAoKSA9PiB7CiAgICB0cnkgewogICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjcmVhdGVXYWxsZXQoKTsKICAgICAgY29uc3QgZnVuZGVkID0gcmVzdWx0Py5mdW5kZWQgPT09IHRydWU7CiAgICAgIGlmIChmdW5kZWQpIHsKICAgICAgICB0b2FzdCh7IHRpdGxlOiAnV2FsbGV0IENyZWF0ZWQhIPCfjoknLCBkZXNjcmlwdGlvbjogJ0Z1bmRlZCB3aXRoIHRlc3RuZXQgWExNIGZpYSBGcmllbmRib3QnIH0pOwogICAgICB9IGVsc2UgewogICAgICAgIHRvYXN0KHsgdGl0bGU6ICdXYWxsZXQgQ3JlYXRlZCcsIGRlc2NyaXB0aW9uOiAnV2FsbGV0IG5lZWRzIGZ1bmRpbmcgLSBGcmllbmRib3Qgd2FzIHVuYXZhaWxhYmxlJyB9KTsKICAgICAgfQogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgY29uc3QgbXNnID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnRmFpbGVkIHRvIGNyZWF0ZSB3YWxsZXQnOwogICAgICB0b2FzdCh7IHRpdGxlOiAnRXJyb3InLCBkZXNjcmlwdGlvbjogbXNnLCB2YXJpYW50OiAnZGVzdHJ1Y3RpdmUnIH0pOwogICAgfQogIH07CgogIGNvbnN0IGhhbmRsZUltcG9ydCA9IGFzeW5jICgpID0+IHsKICAgIGlmICghaW1wb3J0S2V5LnRyaW0oKSkgewogICAgICB0b2FzdCh7IHRpdGxlOiAnTWlzc2luZyBrZXknLCBkZXNjcmlwdGlvbjogJ0VudGVyIHlvdXIgc2VjcmV0IGtleScsIHZhcmlhbnQ6ICdkZXN0cnVjdGl2ZScgfSk7CiAgICAgIHJldHVybjsKICAgIH0KICAgIHRyeSB7CiAgICAgIGF3YWl0IGltcG9ydFdhbGxldChpbXBvcnRLZXkudHJpbSgpKTsKICAgICAgc2V0U2hvd0ltcG9ydChmYWxzZSk7CiAgICAgIHNldEltcG9ydEtleSgnJyk7CiAgICAgIHRvYXN0KHsgdGl0bGU6ICdXYWxsZXQgSW1wb3J0ZWQhIOKchScsIGRlc2NyaXB0aW9uOiAnWW91ciB3YWxsZXQgaXMgcmVhZHknIH0pOwogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgY29uc3QgbXNnID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnRmFpbGVkIHRvIGltcG9ydCB3YWxsZXQnOwogICAgICB0b2FzdCh7IHRpdGxlOiAnRXJyb3InLCBkZXNjcmlwdGlvbjogbXNnLCB2YXJpYW50OiAnZGVzdHJ1Y3RpdmUnIH0pOwogICAgfQogIH07CgogIGNvbnN0IGhhbmRsZUxvZ291dCA9ICgpID0+IHsKICAgIGxvZ291dCgpOwogICAgY2xlYXJQaW4oKTsKICAgIHRvYXN0KHsgdGl0bGU6ICdMb2dnZWQgb3V0JywgZGVzY3JpcHRpb246ICdXYWxsZXQgZGlzY29ubmVjdGVkJyB9KTsKICB9OwoKICBjb25zdCBoYW5kbGVQaW5TZXQgPSAocGluOiBzdHJpbmcpID0+IHsKICAgIHNldFBpbihwaW4pOwogICAgc2V0U2hvd1NldFBpbihmYWxzZSk7CiAgICB0b2FzdCh7IHRpdGxlOiAnUElOIFNldCEg8J+UkicsIGRlc2NyaXB0aW9uOiAnWW91ciB3YWxsZXQgaXMgbm93IHNlY3VyZWQnIH0pOwogIH07CgogIGlmIChzaG93U2V0UGluKSB7CiAgICByZXR1cm4gPFBpbkxvY2sgbW9kZT0ic2V0IiBvblN1Y2Nlc3M9e2hhbmRsZVBpblNldH0gb25DYW5jZWw9eygpID0+IHNldFNob3dTZXRQaW4oZmFsc2UpfSAvPjsKICB9CgogIHJldHVybiAoCiAgICA8ZGl2IGNsYXNzTmFtZT0icHgtNCBwYi0yOCBwdC02IHNwYWNlLXktNSI+CiAgICAgIDxtb3Rpb24uZGl2IGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeTogLTEwIH19IGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fT4KICAgICAgICA8aDEgY2xhc3NOYW1lPSJ0ZXh0LXhsIGZvbnQtYm9sZCB0ZXh0LWZvcmVncm91bmQiPlByb2ZpbGU8L2gxPgogICAgICAgIDxwIGNsYXNzTmFtZT0idGV4dC1zbSB0ZXh0LW11dGVkLWZvcmVncm91bmQiPk1hbmFnZSB5b3VyIHdhbGxldCAmYW1wOyBzZXR0aW5nczwvcD4KICAgICAgPC9tb3Rpb24uZGl2PgoKICAgICAgey8qIFdhbGxldCBDYXJkICovfQogICAgICA8bW90aW9uLmRpdiBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDIwIH19IGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fSB0cmFuc2l0aW9uPXt7IGRlbGF5OiAwLjEgfX0KICAgICAgICBjbGFzc05hbWU9ImdsYXNzLWNhcmQgcC01IGdsb3ctYmx1ZSByZWxhdGl2ZSBvdmVyZmxvdy1oaWRkZW4iPgogICAgICAgIDxkaXYgY2xhc3NOYW1lPSJhYnNvbHV0ZSB0b3AtMCByaWdodC0wIHctMzIgaC0zMiByb3VuZGVkLWZ1bGwgYmctYWNjZW50LzUgYmx1ci0zeGwiIC8+CiAgICAgICAgPGRpdiBjbGFzc05hbWU9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0zIG1iLTQiPgogICAgICAgICAgPGRpdiBjbGFzc05hbWU9InctMTIgaC0xMiByb3VuZGVkLTJ4bCBuZW9uLWdyYWRpZW50IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIj4KICAgICAgICAgICAgPFdhbGxldCBjbGFzc05hbWU9InctNiBoLTYgdGV4dC1wcmltYXJ5LWZvcmVncm91bmQiIC8+CiAgICAgICAgICA8L2Rpdj4KICAgICAgICAgIDxkaXY+CiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT0idGV4dC1zbSBmb250LXNlbWlib2xkIHRleHQtZm9yZWdyb3VuZCI+U3RlbGxhciBXYWxsZXQ8L3A+CiAgICAgICAgICAgIHt3YWxsZXQgPyAoCiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPSJ0ZXh0LXhzIHRleHQtcHJpbWFyeSI+Q29ubmVjdGVkIOKAoiBUZXN0bmV0PC9wPgogICAgICAgICAgICApIDogKAogICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT0idGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQiPk5vdCBjb25uZWN0ZWQ8L3A+CiAgICAgICAgICAgICl9CiAgICAgICAgICA8L2Rpdj4KICAgICAgICA8L2Rpdj4KICAgICAgICB7d2FsbGV0ID8gKAogICAgICAgICAgPGRpdj4KICAgICAgICAgICAgPHAgY2xhc3NOYW1lPSJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtYi0xIj5QdWJsaWMgS2V5PC9wPgogICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2NvcHlBZGRyZXNzfQogICAgICAgICAgICAgIGNsYXNzTmFtZT0idy1mdWxsIGJnLXNlY29uZGFyeS81MCByb3VuZGVkLXhsIHA tMyBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gaG92ZXI6Ymctc2Vjb25kYXJ5LzcwIHRyYW5zaXRpb24tY29sb3JzIj4KICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9ImZvbnQtbW9ubyB0ZXh0LVsxMHB4XSB0ZXh0LWZvcmVncm91bmQgdHJ1bmNhdGUiPnt3YWxsZXQucHVibGljS2V5fTwvc3Bhbj4KICAgICAgICAgICAgICA8Q29weSBjbGFzc05hbWU9InctNCBoLTQgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIHNocmluay0wIG1sLTIiIC8+CiAgICAgICAgICAgIDwvYnV0dG9uPgogICAgICAgICAgICB7YmFsYW5jZSAmJiAoCiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9Im10LTMgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtc20iPgogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSJ0ZXh0LW11dGVkLWZvcmVncm91bmQiPkJhbGFuY2U8L3NwYW4+CiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9InRleHQtZm9yZWdyb3VuZCBmb250LXNlbWlib2xkIj57YmFsYW5jZS54bG1CYWxhbmNlfSBYTE08L3NwYW4+CiAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICl9CiAgICAgICAgICA8L2Rpdj4KICAgICAgICApIDogKAogICAgICAgICAgPHAgY2xhc3NOYW1lPSJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCI+Q3JlYXRlIG9yIGltcG9ydCBhIHdhbGxldCB0byBnZXQgc3RhcnRlZDwvcD4KICAgICAgICApfQogICAgICA8L21vdGlvbi5kaXY+CgogICAgICB7LyogV2FsbGV0IEFjdGlvbnMgKi99CiAgICAgIDxtb3Rpb24uZGl2IGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeTogMjAgfX0gYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB5OiAwIH19IHRyYW5zaXRpb249e3sgZGVsYXk6IDAuMTUgfX0KICAgICAgICBjbGFzc05hbWU9InNwYWNlLXktMiI+CiAgICAgICAgPGgzIGNsYXNzTmFtZT0idGV4dC1zbSBmb250LXNlbWlib2xkIHRleHQtZm9yZWdyb3VuZCBtYi0yIj5XYWxsZXQ8L2gzPgogICAgICAgIDxidXR0b24gb25DbGljaz17aGFuZGxlQ3JlYXRlfSBkaXNhYmxlZD17bG9hZGluZ30KICAgICAgICAgIGNsYXNzTmFtZT0idy1mdWxsIGdsYXNzLWNhcmQgcC00IGZsZXggaXRlbXMtY2VudGVyIGdhcC0zIGhvdmVyOmJnLXNlY29uZGFyeS81MCB0cmFuc2l0aW9uLWNvbG9ycyBkaXNhYmxlZDpvcGFjaXR5LTUwIj4KICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSJ3LTkgaC05IHJvdW5kZWQteGwgYmctc2Vjb25kYXJ5IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIj4KICAgICAgICAgICAge2xvYWRpbmcgPyA8TG9hZGVyMiBjbGFzc05hbWU9InctNCBoLTQgdGV4dC1hY2NlbnQgYW5pbWF0ZS1zcGluIiAvPiA6IDxLZXkgY2xhc3NOYW1lPSJ3LTQgaC00IHRleHQtYWNjZW50IiAvPn0KICAgICAgICAgIDwvZGl2PgogICAgICAgICAgPGRpdiBjbGFzc05hbWU9ImZsZXgtMSB0ZXh0LWxlZnQiPgogICAgICAgICAgICA8cCBjbGFzc05hbWU9InRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1mb3JlZ3JvdW5kIj5DcmVhdGUgTmV3IFdhbGxldDwvcD4KICAgICAgICAgICAgPHAgY2xhc3NOYW1lPSJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCI+R2VuZXJhdGUga2V5cGFpciAmYW1wOyBmdW5kIG9uIHRlc3RuZXQ8L3A+CiAgICAgICAgICA8L2Rpdj4KICAgICAgICAgIDxDaGV2cm9uUmlnaHQgY2xhc3NOYW1lPSJ3LTQgaC00IHRleHQtbXV0ZWQtZm9yZWdyb3VuZCIgLz4KICAgICAgICA8L2J1dHRvbj4KICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldFNob3dJbXBvcnQodHJ1ZSl9IGRpc2FibGVkPXtsb2FkaW5nfQogICAgICAgICAgY2xhc3NOYW1lPSJ3LWZ1bGwgZ2xhc3MtY2FyZCBwLTQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgaG92ZXI6Ymctc2Vjb25kYXJ5LzUwIHRyYW5zaXRpb24tY29sb3JzIGRpc2FibGVkOm9wYWNpdHktNTAiPgogICAgICAgICAgPGRpdiBjbGFzc05hbWU9InctOSBoLTkgcm91bmRlZC14bCBiZy1zZWNvbmRhcnkgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIiPgogICAgICAgICAgICA8RG93bmxvYWQgY2xhc3NOYW1lPSJ3LTQgaC00IHRleHQtYWNjZW50IiAvPgogICAgICAgICAgPC9kaXY+CiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0iZmxleC0xIHRleHQtbGVmdCI+CiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT0idGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWZvcmVncm91bmQiPkltcG9ydCBXYWxsZXQ8L3A+CiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT0idGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQiPkltcG9ydCB3aXRoIFN0ZWxsYXIgc2VjcmV0IGtleTwvcD4KICAgICAgICAgIDwvZGl2PgogICAgICAgICAgPENoZXZyb25SaWdodCBjbGFzc05hbWU9InctNCBoLTQgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIiAvPgogICAgICAgIDwvYnV0dG9uPgogICAgICA8L21vdGlvbi5kaXY+CgogICAgICB7LyogU2VjdXJpdHkgKi99CiAgICAgIDxtb3Rpb24uZGl2IGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeTogMjAgfX0gYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB5OiAwIH19IHRyYW5zaXRpb249e3sgZGVsYXk6IDAuMiB9fQogICAgICAgIGNsYXNzTmFtZT0ic3BhY2UteS0yIj4KICAgICAgICA8aDMgY2xhc3NOYW1lPSJ0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgdGV4dC1mb3JlZ3JvdW5kIG1iLTIiPlNlY3VyaXR5PC9oMz4KICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldFNob3dTZXRQaW4odHJ1ZSl9CiAgICAgICAgICBjbGFzc05hbWU9InctZnVsbCBnbGFzcy1jYXJkIHAtNCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBob3ZlcjpiZy1zZWNvbmRhcnkvNTAgdHJhbnNpdGlvbi1jb2xvcnMiPgogICAgICAgICAgPGRpdiBjbGFzc05hbWU9InctOSBoLTkgcm91bmRlZC14bCBiZy1zZWNvbmRhcnkgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIiPgogICAgICAgICAgICA8U2hpZWxkIGNsYXNzTmFtZT0idy00IGgtNCB0ZXh0LXByaW1hcnkiIC8+CiAgICAgICAgICA8L2Rpdj4KICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSJmbGV4LTEgdGV4dC1sZWZ0Ij4KICAgICAgICAgICAgPHAgY2xhc3NOYW1lPSJ0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZm9yZWdyb3VuZCI+e2lzUGluU2V0ID8gJ0NoYW5nZSBQSU4nIDogJ1NldCBQSU4gTG9jayd9PC9wPgogICAgICAgICAgICA8cCBjbGFzc05hbWU9InRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIj57aXNQaW5TZXQgPyAnUElOIGlzIGFjdGl2ZScgOiAnNC1kaWdpdCBzZWN1cml0eSBQSU4nfTwvcD4KICAgICAgICAgIDwvZGl2PgogICAgICAgICAgPENoZXZyb25SaWdodCBjbGFzc05hbWU9InctNCBoLTQgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIiAvPgogICAgICAgIDwvYnV0dG9uPgogICAgICAgIHt3YWxsZXQgJiYgaXNQaW5TZXQgJiYgKAogICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtsb2NrV2FsbGV0fQogICAgICAgICAgICBjbGFzc05hbWU9InctZnVsbCBnbGFzcy1jYXJkIHAtNCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBob3ZlcjpiZy1zZWNvbmRhcnkvNTAgdHJhbnNpdGlvbi1jb2xvcnMiPgogICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0idy05IGgtOSByb3VuZGVkLXhsIGJnLXNlY29uZGFyeSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciI+CiAgICAgICAgICAgICAgPExvY2sgY2xhc3NOYW1lPSJ3LTQgaC00IHRleHQtYWNjZW50IiAvPgogICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9ImZsZXgtMSB0ZXh0LWxlZnQiPgogICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT0idGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWZvcmVncm91bmQiPkxvY2sgV2FsbGV0PC9wPgogICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT0idGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQiPlJlcXVpcmUgUElOIHRvIGFjY2VzczwvcD4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgIDxDaGV2cm9uUmlnaHQgY2xhc3NOYW1lPSJ3LTQgaC00IHRleHQtbXV0ZWQtZm9yZWdyb3VuZCIgLz4KICAgICAgICAgIDwvYnV0dG9uPgogICAgICAgICl9CiAgICAgIDwvbW90aW9uLmRpdj4KCiAgICAgIHsvKiBMb2dvdXQgKi99CiAgICAgIHt3YWxsZXQgJiYgKAogICAgICAgIDxtb3Rpb24uZGl2IGluaXRpYWw9e3sgb3BhY2l0eTogMCwgeTogMjAgfX0gYW5pbWF0ZT17eyBvcGFjaXR5OiAxLCB5OiAwIH19IHRyYW5zaXRpb249e3sgZGVsYXk6IDAuMjUgfX0+CiAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2hhbmRsZUxvZ291dH0KICAgICAgICAgICAgY2xhc3NOYW1lPSJ3LWZ1bGwgZ2xhc3MtY2FyZCBwLTQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTIgdGV4dC1kZXN0cnVjdGl2ZSBob3ZlcjpiZy1kZXN0cnVjdGl2ZS8xMCB0cmFuc2l0aW9uLWNvbG9ycyI+CiAgICAgICAgICAgIDxMb2dPdXQgY2xhc3NOYW1lPSJ3LTQgaC00IiAvPgogICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9InRleHQtc20gZm9udC1tZWRpdW0iPkRpc2Nvbm5lY3QgV2FsbGV0PC9zcGFuPgogICAgICAgICAgPC9idXR0b24+CiAgICAgICAgPC9tb3Rpb24uZGl2PgogICAgICApfQoKICAgICAgPGRpdiBjbGFzc05hbWU9InRleHQtY2VudGVyIHB5LTQiPgogICAgICAgIDxzcGFuIGNsYXNzTmFtZT0idGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQiPlBvd2VyZWQgYnkgPHNwYW4gY2xhc3NOYW1lPSJuZW9uLWdyYWRpZW50LXRleHQgZm9udC1zZW1pYm9sZCI+U3RlbGxhcjwvc3Bhbj4g4pqhPC9zcGFuPgogICAgICA8L2Rpdj4KCiAgICAgIHsvKiBJbXBvcnQgTW9kYWwgKi99CiAgICAgIDxEaWFsb2cgb3Blbj17c2hvd0ltcG9ydH0gb25PcGVuQ2hhbmdlPXtzZXRTaG93SW1wb3J0fT4KICAgICAgICA8RGlhbG9nQ29udGVudCBjbGFzc05hbWU9ImdsYXNzLWNhcmQgYm9yZGVyLWJvcmRlci81MCBtYXgtdy1zbSBteC1hdXRvIj4KICAgICAgICAgIDxEaWFsb2dIZWFkZXI+CiAgICAgICAgICAgIDxEaWFsb2dUaXRsZSBjbGFzc05hbWU9InRleHQtZm9yZWdyb3VuZCI+SW1wb3J0IFdhbGxldDwvRGlhbG9nVGl0bGU+CiAgICAgICAgICA8L0RpYWxvZ0hlYWRlcj4KICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSJzcGFjZS15LTQgcHktMiI+CiAgICAgICAgICAgIDxkaXY+CiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0idGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LW11dGVkLWZvcmVncm91bmQgbWItMS41IGJsb2NrIj5TZWNyZXQgS2V5PC9sYWJlbD4KICAgICAgICAgICAgICA8aW5wdXQgdmFsdWU9e2ltcG9ydEtleX0gb25DaGFuZ2U9eyhlKSA9PiBzZXRJbXBvcnRLZXkoZS50YXJnZXQudmFsdWUpfSBwbGFjZWhvbGRlcj0iUy4uLiIKICAgICAgICAgICAgICAgIGNsYXNzTmFtZT0idy1mdWxsIGJnLXNlY29uZGFyeS81MCBib3JkZXIgYm9yZGVyLWJvcmRlci81MCByb3VuZGVkLXhsIHB4LTQgcHktMyB0ZXh0LXNtIHRleHQtZm9yZWdyb3VuZCBwbGFjZWhvbGRlcjp0ZXh0LW11dGVkLWZvcmVncm91bmQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLXByaW1hcnkgZm9udC1tb25vIiAvPgogICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT0idGV4dC1bMTBweF0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG10LTEiPllvdXIgc2VjcmV0IGtleSBzdGFydHMgd2l0aCAnUycgYW5kIGlzIDU2IGNoYXJhY3RlcnMgbG9uZzwvcD4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17aGFuZGxlSW1wb3J0fSBkaXNhYmxlZD17bG9hZGluZ30KICAgICAgICAgICAgICBjbGFzc05hbWU9InctZnVsbCBuZW9uLWdyYWRpZW50IHRleHQtcHJpbWFyeS1mb3JlZ3JvdW5kIGZvbnQtc2VtaWJvbGQgcHktMyByb3VuZGVkLXhsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0yIGRpc2FibGVkOm9wYWNpdHktNTAiPgogICAgICAgICAgICAgIHtsb2FkaW5nID8gPD48TG9hZGVyMiBjbGFzc05hbWU9InctNCBoLTQgYW5pbWF0ZS1zcGluIiAvPiBJbXBvcnRpbmcuLi48Lz4gOiAnSW1wb3J0IFdhbGxldCd9CiAgICAgICAgICAgIDwvYnV0dG9uPgogICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9EaWFsb2dDb250ZW50PgogICAgICA8L0RpYWxvZz4KICAgIDwvZGl2PgogICk7Cn07CgpleHBvcnQgZGVmYXVsdCBQcm9maWxlU2NyZWVuOwo=