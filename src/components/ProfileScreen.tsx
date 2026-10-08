import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, LogOut, Key, Shield, ChevronRight, Wallet, Loader2, Lock, Unlock } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { usePin } from '@/hooks/usePin';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Secret Key</label>
              <input value={importKey} onChange={(e) => setImportKey(e.target.value)} placeholder="S..."
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
