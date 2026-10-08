import { Home, Send, Compass, Bot, User, Clock, Users, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

export type Tab = 'home' | 'send' | 'explore' | 'ai' | 'profile' | 'activity' | 'contacts' | 'card';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs = [
  { id: 'home' as Tab, icon: Home, label: 'Home' },
  { id: 'activity' as Tab, icon: Clock, label: 'Activity' },
  { id: 'send' as Tab, icon: Send, label: 'Send' },
  { id: 'ai' as Tab, icon: Bot, label: 'AI' },
  { id: 'profile' as Tab, icon: User, label: 'Profile' },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/30 rounded-none rounded-t-3xl px-2 pb-safe max-w-md mx-auto">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2 transition-colors">
              {isActive && (
                <motion.div layoutId="activeTab"
                  className="absolute -top-1 left-1/2-translate-x-1/2 w-8 h-1 rounded-full neon-gradient"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
              {tab.id === 'send' ? (
                <div className={`w-10 h-10 -mt-4 rounded-2xl flex items-center justify-center shadow-lg ${isActive ? 'neon-gradient shadow-primary/20' : 'bg-secondary'}`}>
                  <tab.icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>
              ) : (
                <tab.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
