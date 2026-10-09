import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Check } from 'lucide-react';
import { TOKENS, Token } from '@/lib/mockData';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'stablecoins', label: 'Stablecoins' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'real-world', label: 'Real World Assets' },
];

const ExploreScreen = () => {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [added, setAdded] = useState<string[]>([]);

  const filtered = TOKENS.filter((t) => {
    if (category !== 'all' && t.category !== category) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const addToken = (token: Token) => {
    setAdded((prev) => [...prev, token.symbol]);
    toast({ title: `${token.symbol} added!`, description: `${token.name} added to your wallet` });
  };

  return (
    <div className="px-4 pb-28 pt-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-foreground">Explore Assets</h1>
        <p className="text-sm text-muted-foreground">Discover tokens on Stellar</p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative">
        <Search className="absolute left-3 top-1/2--translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tokens..."
          className="w-full bg-secondary/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </motion.div>

      {/* Categories */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${category === cat.id ? 'neon-gradient text-primary-foreground' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
            {cat.label}
          </button>
        ))}
      </motion.div>

      {/* Token List */}
      <div className="space-y-3">
        {filtered.map((token, i) => (
          <motion.div key={token.symbol}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
            className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg">
              {token.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{token.symbol}</p>
                <span className={`text-[10px] font-medium ${token.change.startsWith('+') ? 'text-primary' : 'text-destructive'}`}>{token.change}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{token.description}</p>
              <p className="text-xs text-foreground mt-0.5 font-medium">{token.price}</p>
            </div>
            <button
              onClick={() => addToken(token)}
              disabled={added.includes(token.symbol)}
              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${added.includes(token.symbol) ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'}`}
            >
              {added.includes(token.symbol) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ExploreScreen;
