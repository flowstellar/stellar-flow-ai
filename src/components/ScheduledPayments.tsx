import { motion } from 'framer-motion';
import { CalendarClock, ToggleRight } from 'lucide-react';
import { SCHEDULED_PAYMENTS } from '@/lib/mockData';

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
            <ToggleRight aria-hidden="true" className={`w-6 h-6 ${sp.active ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ScheduledPayments;
