import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, Filter } from 'lucide-react';
import { TRANSACTIONS } from '@/lib/mockData';

type FilterType = 'all' | 'sent' | 'received';

export const EXTENDED_TRANSACTIONS = [
  ...TRANSACTIONS,
  { id: '6', type: 'received' as const, amount: '75.00', asset: 'XLM', address: 'GBKX...4F2Q', date: '2 days ago', status: 'completed' as const },
  { id: '7', type: 'sent' as const, amount: '30.00', asset: 'USDC', address: 'GDPK...9M1T', date: '3 days ago', status: 'completed' as const },
  { id: '8', type: 'received' as const, amount: '1,000.00', asset: 'XLM', address: 'GAWL...2N7P', date: '4 days ago', status: 'completed' as const },
  { id: '9', type: 'sent' as const, amount: '15.50', asset: 'XLM', address: 'GBEX...5R2W', date: '5 days ago', status: 'completed' as const },
  { id: '10', type: 'received' as const, amount: '200.00', asset: 'HOUSE', address: 'GCWZ...8K3R', date: '1 week ago', status: 'completed' as const },
];

const ActivityScreen = () => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = EXTENDED_TRANSACTIONS.filter((tx) => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const sentTotal = EXTENDED_TRANSACTIONS.filter(t => t.type === 'sent').length;
  const receivedTotal = EXTENDED_TRANSACTIONS.filter(t => t.type === 'received').length;

  return (
    <div className="px-4 pb-28 pt-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-foreground">Activity</h1>
        <p className="text-sm text-muted-foreground">Your transaction history</p>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-2">
        <div className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{EXTENDED_TRANSACTIONS.length}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-destructive">{sentTotal}</p>
          <p className="text-[10px] text-muted-foreground">Sent</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-primary">{receivedTotal}</p>
          <p className="text-[10px] text-muted-foreground">Received</p>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="flex gap-2">
        {(['all', 'sent', 'received'] as FilterType[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
              filter === f ? 'neon-gradient text-primary-foreground' : 'glass-card text-muted-foreground hover:text-foreground'
            }`:>

            {f}
          </button>
        ))}
      </motion.div>

      {/* Storytelling */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="glass-card p-3 gradient-border">
        <p className="text-[11px] text-muted-foreground text-center italic">
          "You sent money across borders instantly. No hidden fees."
        </p>
      </motion.div>

      {/* Transaction list */}
      <div className="space-y-2">
        {filtered.map((tx, i) => (
          <motion.div key={tx.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.03 }}
            className="glass-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                tx.type === 'sent' ? 'bg-destructive/10' : 'bg-primary/10'
              }`:>
                {tx.type === 'sent'
                  ? <ArrowUpRight className="w-4 h-4 text-destructive" />
                  : <ArrowDownLeft className="w-4 h-4 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{tx.type === 'sent' ? 'Sent' : 'Received'}</p>
                <p className="text-xs text-muted-foreground font-mono">{tx.address}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{tx.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${tx.type === 'sent' ? 'text-destructive' : 'text-primary'}`}>
                {tx.type === 'sent' ? '-' : '+'}{tx.amount} {tx.asset}
              </p>
              <span className={`text-[10px] flex items-center gap-1 justify-end ${
                tx.status === 'pending' ? 'text-muted-foreground' : 'text-primary/70'
              }`:>
                {tx.status === 'pending'
                  ? <><Clock className="w-2.5 h-2.5" /> Pending<>
                  : <><CheckCircle2 className="w-2.5 h-2.5" /> Success<>}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ActivityScreen;
