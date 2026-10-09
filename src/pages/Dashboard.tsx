import { useState } from 'react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Menu, X, Zap } from 'lucide-react';
import BottomNav, { Tab } from '@/components/BottomNav';
import HomeScreen from '@/components/HomeScreen';
import SendScreen from '@/components/SendScreen';
import ExploreScreen from '@/components/ExploreScreen';
import AIAssistant from '@/components/AIAssistant';
import ProfileScreen from '@/components/ProfileScreen';
import ActivityScreen from '@/components/ActivityScreen';
import ContactsScreen from '@/components/ContactsScreen';
import CardManagement from '@/components/CardManagement';
import DashboardSidebar from '@/components/DashboardSidebar';
import PinLock from '@/components/PinLock';
import { WalletProvider } from '@/hooks/useWallet';
import { PinProvider, usePin } from '@/hooks/usePin';
import { toast } from '@/hooks/use-toast';

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const { isPinSet, isLocked, verifyPin, unlockWallet } = usePin();
  const [pinError, setPinError] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePinVerify = (pin: string) => {
    if (verifyPin(pin)) {
      unlockWallet();
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  if (isPinSet && isLocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full">
          <PinLock mode="verify" onSuccess={handlePinVerify} onFailure={() => setPinError(true)} />
        </div>
      </div>
    );
  }

  const renderScreen = (tab: Tab) => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onNavigate={(tab) => setActiveTab(tab)} />;
      case 'send':
        return <SendScreen />;
      case 'explore':
        return <ExploreScreen />;
      case 'ai':
        return <AIAssistant onNavigate={(tab) => setActiveTab(tab as Tab)} />;
      case 'profile':
        return <ProfileScreen />;
      case 'activity':
        return <ActivityScreen />;
      case 'contacts':
        return <ContactsScreen />;
      case 'card' as Tab:
        return <CardManagement />;
      default:
        return <HomeScreen onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-14 lg:h-16 glass-card border-b border-border/30 rounded-none flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-muted-foreground hover:text-foreground">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg neon-gradient flex items-center justify-center">
                <Zap className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold">Stellar<span className="neon-gradient-text">Flow</span></span>
            </div>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:block text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => toast({ title: 'No new notifications' })}
              className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
            </button>
            <div className="w-8 h-8 rounded-xl neon-gradient flex items-center justify-center text-primary-foreground text-xs font-bold cursor-pointer"
              onClick={() => setActiveTab('profile')}>
              SU
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, x: -300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -300 }}
              className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
              <div className="relative w-64 h-full glass-card border-r border-border/30 rounded-none p-4">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-xl neon-gradient flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-base font-bold">Stellar<span className="neon-gradient-text">Flow</span></span>
                </div>
                <nav className="space-y-1">
                  {([
                    { id: 'home' as Tab, label: 'Dashboard' },
                    { id: 'send' as Tab, label: 'Send Money' },
                    { id: 'activity' as Tab, label: 'Transactions' },
                    { id: 'explore' as Tab, label: 'Explore' },
                    { id: 'contacts' as Tab, label: 'Contacts' },
                    { id: 'card' as Tab, label: 'Card' },
                    { id: 'ai' as Tab, label: 'AI Agent' },
                    { id: 'profile' as Tab, label: 'Settings' },
                  ]).map(item => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeTab === item.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      }`}>
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}>
                {renderScreen(activeTab)}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export { DashboardContent };
const Dashboard = () => {
  return (
    <WalletProvider>
      <PinProvider>
        <DashboardContent />
      </PinProvider>
    </WalletProvider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export default Dashboard;
