import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, TrendingDown } from 'lucide-react';
import { convertXlm, RATES } from '../lib/convertXlm';

const CurrencyConverter = () => {
  const [xlmAmount, setXlmAmount] = useState('100');
  const [currency, setCurrency] = useState('USD');

  const rate = RATES[currency];
  const converted = convertXlm(xlmAmount, currency);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Currency Converter</h3>
        <ArrowDownUp className="w-4 h-4 text-primary" />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground mb-1 block">XLM</label>
          <input value={xlmAmount} onChange={(e) => setXlmAmount(e.target.value)} type="number"
            className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground mb-1 block">{currency}</label>
          <div className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground font-semibold">
            {rate.symbol}{converted}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(RATES).map(([key, val]) => (
          <button key={key} onClick={() => setCurrency(key)}
            className={`-x-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
              currency === key ? 'neon-gradient text-primary-foreground' : 'glass-card text-muted-foreground'
            }`}>
            {val.flag} {key}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-primary bg-primary/5 rounded-xl px-3 py-2">
        <TrendingDown className="w-3.5 h-3.5 shrink-0" />
        <span>You saved <strong>60% in fees</strong> using Stellar vs traditional wire</span>
      </div>
    </motion.div>
  );
};

export default CurrencyConverter;
