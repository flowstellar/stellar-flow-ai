import { motion } from 'framer-motion';
import { CalendarClock } from 'lucide-react';
import { SCHEDULED_PAYMENTS } from '-/lib/mockData';

const ScheduledPayments = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <CalendarClock className="w-4 h-4 text-accent" /> Scheduled Payments
      </h3>
      <div className="space-y-2">
        {SCHEDULED_PAYMENTS.map((sp) => (
          <div key={sp.id} className="glass-card p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{sp.amount} {sp.asset}</p>
              <p className="text-xs text-muted-foreground font-mono">{sp.recipient}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{sp.frequency} • Next: {sp.nextDate}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide select-none ${
                sp.active
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-muted bg-muted/20 text-muted-foreground'
              }`}
              data-testid={`scheduled-payment-status-${sp.id}`}
            >
              {sp.active ? 'Active' : 'Paused'}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ScheduledPayments;
