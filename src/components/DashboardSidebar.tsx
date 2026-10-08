import { Home, Send, Compass, Bot, User, Clock, Users, CreditCard, BarChart3, Zap } from 'lucide-react';
import { Tab } from './BottomNav';

interface DashboardSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const MENU_ITEMS: { id: Tab; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Dashboard' },
  { id: 'send', icon: Send, label: 'Send Money' },
  { id: 'activity', icon: Clock, label: 'Transactions' },
  { id: 'explore', icon: Compass, label: 'Explore' },
  { id: 'contacts', icon: Users, label: 'Contacts' },
  { id: 'card' as Tab, icon: CreditCard, label: 'Card' },
  { id: 'ai', icon: Bot, label: 'AI Agent' },
  { id: 'profile', icon: User, label: 'Settings' },
];

const DashboardSidebar = ({ activeTab, onTabChange, collapsed }: DashboardSidebarProps) => {
  return (
    <aside className={`hidden lg:flex flex-col h-screen sticky top-0 glass-card border-r border-border/30 rounded-none transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border/30">
        <div className="w-8 h-8 rounded-xl neon-gradient flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
        </div>
        {!collapsed && <span className="ml-3 text-base font-bold">Stellar<span className="neon-gradient-text">Flow</span></span>}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {MENU_ITEMS.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => onTabChange(item.id)} aria-label={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${/
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}>
              <item.icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-primary' : ''}`} aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border/30">
          <div className="glass-card p-3 rounded-xl text-center">
            <p className="text-[10px] text-muted-foreground">Powered by <span className="neon-gradient-text font-semibold">Stellar</span> ⚡</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default DashboardSidebar;
