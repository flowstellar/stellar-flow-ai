export interface Token {
  symbol: string;
  name: string;
  description: string;
  category: 'stablecoins' | 'gaming' | 'real-world';
  price: string;
  change: string;
  icon: string;
}

export interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: string;
  asset: string;
  address: string;
  date: string;
  status: 'completed' | 'pending';
}

export interface ScheduledPayment {
  id: string;
  recipient: string;
  amount: string;
  asset: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextDate: string;
  active: boolean;
}

export const TOKENS: Token[] = [
  { symbol: 'USDC', name: 'USD Coin', description: 'Dollar-pegged stablecoin on Stellar', category: 'stablecoins', price: '$1.00', change: '+0.01%', icon: '💵' },
  { symbol: 'EURC', name: 'Euro Coin', description: 'Euro-pegged stablecoin on Stellar', category: 'stablecoins', price: '$1.08', change: '+0.03%', icon: '💶' },
  { symbol: 'GAME', name: 'GameFi Token', description: 'In-game currency for Web3 gaming', category: 'gaming', price: '$0.42', change: '+12.5%', icon: '🎮' },
  { symbol: 'HOUSE', name: 'RealEstate Token', description: 'Fractional real estate ownership', category: 'real-world', price: '$15.20', change: '+2.1%', icon: '🏠' },
  { symbol: 'CREATOR', name: 'Creator Coin', description: 'Support your favorite creators', category: 'real-world', price: '$0.85', change: '+5.3%', icon: '🎨' },
];

export const TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'sent', amount: '50.00', asset: 'XLM', address: 'GBKX...4F2Q', date: '2 min ago', status: 'completed' },
  { id: '2', type: 'received', amount: '120.00', asset: 'USDC', address: 'GCWZ...8K3R', date: '1 hour ago', status: 'completed' },
  { id: '3', type: 'sent', amount: '25.00', asset: 'XLM', address: 'GDPK...9M1T', date: '3 hours ago', status: 'completed' },
  { id: '4', type: 'received', amount: '500.00', asset: 'XLM', address: 'GAWL...2N7P', date: 'Yesterday', status: 'completed' },
  { id: '5', type: 'sent', amount: '10.00', asset: 'GAME', address: 'GBEX...5R2W', date: 'Yesterday', status: 'pending' },
];

export const SCHEDULED_PAYMENTS: ScheduledPayment[] = [
  { id: '1', recipient: 'GBKX...4F2Q', amount: '100', asset: 'XLM', frequency: 'weekly', nextDate: 'Apr 2, 2026', active: true },
  { id: '2', recipient: 'GCWZ...8K3R', amount: '50', asset: 'USDC', frequency: 'monthly', nextDate: 'Apr 15, 2026', active: true },
];

export const SPENDING_DATA = [
  { day: 'Mon', amount: 45 },
  { day: 'Tue', amount: 120 },
  { day: 'Wed', amount: 30 },
  { day: 'Thu', amount: 85 },
  { day: 'Fri', amount: 200 },
  { day: 'Sat', amount: 60 },
  { day: 'Sun', amount: 15 },
];
