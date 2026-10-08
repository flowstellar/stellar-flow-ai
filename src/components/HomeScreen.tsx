import { motion } from 'framer-motion';
import { Copy, ArrowUpRight, ArrowDownLeft, Compass, Sparkles, Clock, RefreshCw, Loader2, TrendingUp, Users } from 'lucide-react';
import { TRANSACTIONS, SPENDING_DATA } from '@/lib/mockData';
import { toast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import ReceiveModal from './ReceiveModal';
import CurrencyConverter from './CurrencyConverter';
import GamificationCard from './GamificationCard';
import { useWallet } from '@/hooks/useWallet';
import { Tab } from './BottomNav';

interface HomeScreenProps {
  onNavigate: (tab: Tab) => void;
}

const MONTHLY_DATA = [
  { month: 'Jan', amount: 1200 },
  { month: 'Feb', amount: 980 },
  { month: 'Mar', amount: 1500 },
  { month: 'Apr', amount: 800 },
];

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  const [showReceive, setShowReceive] = useState(false);
  const { wallet, balance, balanceLoading, refreshBalance } = useWallet();

  const copyAddress = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.publicKey);
    toast({ title: 'Address copied!', description: 'Wallet address copied to clipboard' });
  };

  const xlmBalance = balance?.xlmBalance || '0.00';
  const usdValue = balance?.usdValue || '$0.00';
  const truncatedAddress = wallet ? `${wallet.publicKey.slice(0, 8)}...${wallet.publicKey.slice(-6)}` : 'No wallet';

  return (
    <div className="px-4 pb-28 pt-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Welcome back</p>
          <h1 className="text-xl font-bold text-foreground">StellarFlow</h1>
        </div>
        <div className="w-9 h-9 rounded-full neon-gradient flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-5 glow-green relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
        <div className="flex items-center justify-between mb-1">
          <p className="text-muted-foreground text-sm">Total Balance</p>
          <button onClick={refreshBalance} disabled={balanceLoading} aria-label="Refresh balance"
            className="text-muted-foreground hover:text-foreground transition-colors">
            {balanceLoading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
        <h2 className="text-3xl font-bold text-foreground glow-text-green">
          {xlmBalance} <span className="text-lg text-muted-foreground">XLM</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">≈  {usdValue}</p>
        {wallet && (
          <button onClick={copyAddress} aria-label="Copy wallet address" className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <span className="font-mono truncate max-w-[180px]">{truncatedAddress}</span>
            <Copy className="w-3 h-3 shrink-0" aria-hidden="true" />
          </button>
        )}
        {!wallet && (
          <p className="mt-3 text-xs text-muted-foreground">Go to Profile to create or import a wallet</p>
        )}
        {wallet && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-[10px] text-primary font-medium">Stellar Testnet</span>
          </div>
        )}
        {balance?.balances && balance.balances.filter(b => b.asset_type !== 'native').length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30 space-y-1">
            {balance.balances.filter(b => b.asset_type !== 'native').map((b, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{b.asset_code || 'Unknown'}</span>
                <span className="text-foreground font-medium">{parseFloat(b.balance).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-4 gap-2">
        {[
          { icon: ArrowUpRight, label: 'Send', color: 'text-primary', action: () => onNavigate('send') },
          { icon: ArrowDownLeft, label: 'Receive', color: 'text-accent', action: () => setShowReceive(true) },
          { icon: Users, label: 'Contacts', color: 'text-neon-purple', action: () => onNavigate('contacts') },
          { icon: Compass, label: 'Explore', color: 'text-primary', action: () => onNavigate('explore') },
        ].map((item) => (
          <button key={item.label} onClick={item.action}
            className="glass-card p-3 flex flex-col items-center gap-1.5 hover:bg-secondary/50 transition-colors active:scale-95">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <item.icon className={`w-4 h-4 ${item.color}`} aria-hidden="true" />
            </div>
            <span className="text-[10px] font-medium text-foreground">{item.label}</span>
          </button>
        ))}
      </motion.div>

      {/* AI Insight + Storytelling */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card p-4 flex items-center gap-3 gradient-border">
        <div className="w-8 h-8 rounded-lg neon-gradient flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-secondary-foreground">You saved <span className="text-primary font-semibold">30% in fees</span> using Stellar this week 🎉</p>
          <p className="text-[10px] text-muted-foreground italic">"Financial freedom, simplified."</p>
        </div>
      </motion.div>

      {/* Currency Converter */}
      <CurrencyConverter />

      {/* Insights */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Weekly Spending</h3>
          <span className="text-xs text-muted-foreground">$555 total</span>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SPENDING_DATA}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(260 10% 55%)', fontSize: 10 }} />
              <Bar dataKey="amount" fill="hsl(155 100% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>7 transactions</span>
          <span>•</span>
          <span className="text-primary">↓ 12% vs last week</span>
        </div>
        {/* AI tip */}
        <div className="bg-accent/5 rounded-xl px-3 py-2 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
          <p className="text-[11px] text-muted-foreground">You are spending more on transfers this week. Consider batching payments.</p>
        </div>
      </motion.div>

      {/* Monthly overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Monthly Overview</h3>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_DATA}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(260 10% 55%)', fontSize: 10 }} />
              <Bar dataKey="amount" fill="hsl(210 100% 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Gamification */}
      <GamificationCard />

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
          <button onClick={() => onNavigate('activity')} className="text-xs text-primary hover:underline">View all</button>
        </div>
        <div className="space-y-2">
          {TRANSACTIONS.slice(0, 3).map((tx) => (
            <div key={tx.id} className="glass-card p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'sent' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                  {tx.type === 'sent' ? <ArrowUpRight className="w-4 h-4 text-destructive" aria-hidden="true" /> : <ArrowDownLeft className="w-4 h-4 text-primary" aria-hidden="true" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{tx.type === 'sent' ? 'Sent' : 'Received'}</p>
                  <p className="text-xs text-muted-foreground">{tx.address} • {tx.date}</p>
                </div>
              </div>
              <p className={`text-sm font-semibold ${tx.type === 'sent' ? 'text-destructive' : 'text-primary'}`}>
                {tx.type === 'sent' ? '-' : '+'}{tx.amount} {tx.asset}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Powered by Stellar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-center py-4">
        <span className="text-xs text-muted-foreground">Powered by <span className="neon-gradient-text font-semibold">Stellar</span> ⚡</span>
      </motion.div>

      <ReceiveModal open={showReceive} onClose={() => setShowReceive(false)} />
    </div>
  );
};

export default HomeScreen;
