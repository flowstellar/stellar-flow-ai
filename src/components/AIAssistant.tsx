import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, ArrowUpRight, BarChart3, CalendarClock, CheckCircle2, Loader2, XCircle, Clock, Zap, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { usePin } from '@/hooks/usePin';
import { stellarApi } from '@/lib/stellarApi';
import PinLock from './PinLock';

interface TxPending {
  destination: string;
  amount: string;
  asset: string;
  memo?: string;
  idempotencyKey?: string;
  status?: 'awaiting' | 'pin' | 'building' | 'signing' | 'submitting' | 'confirming';
}

interface TxResult {
  status: 'success' | 'error';
  hash?: string;
  message: string;
  amount?: string;
  asset?: string;
  destination?: string;
  timestamp?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: { label: string; type: 'send' | 'navigate' | 'info'; data?: Record<string, string> };
  txPending?: TxPending;
  txResult?: TxResult;
}

interface TxHistoryEntry {
  hash: string;
  amount: string;
  asset: string;
  destination: string;
  timestamp: string;
  status: 'success' | 'error';
}

const TX_HISTORY_KEY = 'stellarflow_ai_tx_history';

const generateIdempotencyKey = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const loadTxHistory = (): TxHistoryEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(TX_HISTORY_KEY) || '[]');
  } catch { return []; }
};

const saveTxHistory = (entry: TxHistoryEntry) => {
  const history = loadTxHistory();
  history.unshift(entry);
  localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
};

const EXAMPLE_PROMPTS = [
  { text: 'Send 10 XLM to GDEMO...', icon: ArrowUpRight },
  { text: 'Show my transaction history', icon: History },
  { text: 'Check my balance', icon: BarChart3 },
  { text: 'Schedule weekly payment', icon: CalendarClock },
];

const STATUS_LABELS: Record<string, { text: string; icon: typeof Loader2 }> = {
  awaiting: { text: 'Waiting for approval...', icon: Clock },
  pin: { text: 'PIN verification required...', icon: Zap },
  building: { text: 'Building transaction...', icon: Loader2 },
  signing: { text: 'Signing transaction...', icon: Loader2 },
  submitting: { text: 'Submitting to Stellar network...', icon: Loader2 },
  confirming: { text: 'Waiting for confirmation...', icon: Loader2 },
};

interface AIAssistantProps {
  onNavigate?: (tab: string) => void;
}

const AIAssistant = ({ onNavigate }: AIAssistantProps) => {
  const { wallet, refreshBalance } = useWallet();
  const { isPinSet, verifyPin } = usePin();
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: "Hi! I'm your **StellarFlow AI agent**. I can execute real Stellar payments for you.\n\nTry: *\"Send 5 XLM to G...\"* or *\"Show my transaction history\"*" },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [showPinFor, setShowPinFor] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const updateTxStatus = (msgId: string, status: TxPending['status']) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId && m.txPending ? { ...m, txPending: { ...m.txPending, status } } : m
    ));
  };

  const parseCommand = (text: string): Partial<Message> => {
    const lower = text.toLowerCase();

    // Send command — "send 5 xlm to GXXX..."
    const sendMatch = text.match(/send\s+(\d+.?\d*)\s+(xlm|usdc|eurc)?\s*(?:to\s+)?(G[A-Z0-9]{50,})/i);
    if (sendMatch) {
      const [, amount, rawAsset, destination] = sendMatch;
      const asset = (rawAsset || 'XLM').toUpperCase();
      return {
        content: `🔄 **Transaction Request**\n\nI'll send **${amount} ${asset}** to:\n\`${destination.slice(0, 8)}...${destination.slice(-6)}\`,
        txPending: { destination, amount, asset, idempotencyKey: generateIdempotencyKey(), status: 'awaiting' },
      };
    }

    // Loose send without valid address
    const looseSend = lower.match(/send\s+(\d+.?\d*)\s*(xlm|usdc|eurc)?\s*(to\s+)?(.+)?/i);
    if (looseSend) {
      const amount = looseSend[1];
      const asset = (looseSend[2] || 'XLM').toUpperCase();
      const who = looseSend[4]?.trim() || 'someone';
      return {
        content: `I’d love to send **${amount} ${asset}** to **${who}**, but I need a valid Stellar address (starts with G, 56 characters).\n\nTry: *\"Send ${amount} ${asset} to GABC...XYZ\*R`,
      };
    }

    // Transaction history
    if (lower.includes('history') || (lower.includes('transaction') && !lower.includes('send'))) {
      const history = loadTxHistory();
      if (history.length === 0) {
        return { content: "📭 No transactions yet. Send your first payment and it'll show up here!\n\nTry: *\"Send 5 XLM to G...\"* " };
      }
      const lines = history.slice(0, 5).map((tx, i) =>
        `${i + 1}. **${tx.amount} ${tx.asset}** → \`${tx.destination.slice(0, 6)}...${tx.destination.slice(-4)}\` ${tx.status === 'success' ? '✅' : '⍋'}\n   ${new Date(tx.timestamp).toLocaleString()}`
      ).join('\n\n');
      return { content: `📜 **Recent Transactions** (${history.length} total)\n\n${lines}${history.length > 5 ? '\n\n_...and more_' : ''}` };
    }

    if (lower.includes('activity')) {
      return {
        content: "Opening your **Activity** screen.",
        action: { label: 'View Activity', type: 'navigate', data: { tab: 'activity' } },
      };
    }

    if (lower.includes('balance') || lower.includes('wallet')) {
      return {
        content: "Let me show your wallet balance.",
        action: { label: 'View Balance', type: 'navigate', data: { tab: 'home' } },
      };
    }

    if (lower.includes('contact')) {
      return {
        content: "Opening your **Contacts**.",
        action: { label: 'View Contacts', type: 'navigate', data: { tab: 'contacts' } },
      };
    }

    if (lower.includes('explore') || lower.includes('token')) {
      return {
        content: "Opening **Explore** to browse Stellar assets.",
        action: { label: 'Explore Tokens', type: 'navigate', data: { tab: 'explore' } },
      };
    }

    if (lower.includes('schedule') || lower.includes('recurring')) {
      return {
        content: "Opening the **Send** screen for payments.",
        action: { label: 'Go to Send', type: 'navigate', data: { tab: 'send' } },
      };
    }

    return {
      content: "I'm your **AI payment agent**! Here's what I can do:\n\n• 💸 *\"Send 10 XLM to GABC...XYZ\"* — execute a real payment\n• 📜 *\"Show my transaction history\"*\n• 💰 *\"Check my balance\"*\n• 👥 *\"Show contacts\"*\n• 🔍 *\"Explore tokens\"*",
    };
  };

  const handleAction = (action: Message['action']) => {
    if (action?.type === 'navigate' && action.data?.tab && onNavigate) {
      onNavigate(action.data.tab);
    }
  };

  const handleApproveTx = (msgId: string) => {
    if (!wallet) {
      toast({ title: 'No wallet', description: 'Create a wallet first in Profile', variant: 'destructive' });
      return;
    }
    if (isPinSet) {
      updateTxStatus(msgId, 'pin');
      setShowPinFor(msgId);
    } else {
      executeTx(msgId);
    }
  };

  const handlePinSuccess = (pin: string) => {
    if (!showPinFor) return;
    if (verifyPin(pin)) {
      const msgId = showPinFor;
      setShowPinFor(null);
      executeTx(msgId);
    } else {
      toast({ title: 'Wrong PIN', description: 'Please try again', variant: 'destructive' });
    }
  };

  const executeTx = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.txPending || !wallet) return;

    setActiveTxId(msgId);
    const { destination, amount, asset, memo, idempotencyKey } = msg.txPending;

    try {
      // Step 1: Building
      updateTxStatus(msgId, 'building');
      await new Promise(r => setTimeout(r, 800));

      // Step 2: Signing
      updateTxStatus(msgId, 'signing');
      await new Promise(r => setTimeout(r, 600));

      // Step 3: Submitting
      updateTxStatus(msgId, 'submitting');

      const result = await stellarApi.sendPayment({
        secretKey: wallet.secretKey,
        destination,
        amount,
        memo,
        idempotencyKey,
      });

      // Step 4: Confirming
      updateTxStatus(msgId, 'confirming');
      await new Promise(r => setTimeout(r, 500));

      // Save to history
      saveTxHistory({
        hash: result.hash,
        amount,
        asset,
        destination,
        timestamp: result.createdAt || new Date().toISOString(),
        status: 'success',
      });

      // Done
      setMessages(prev => prev.map(m =>
        m.id === msgId
          ? { ...m, txPending: undefined, txResult: { status: 'success', hash: result.hash, message: `Payment successful! Sent ${amount} ${asset}`, amount, asset, destination, timestamp: result.createdAt } }
          : m
      ));

      await refreshBalance();
      toast({ title: 'Payment sent! ✅', description: `${amount} ${asset} sent across borders instantly.` });

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Transaction failed';

      saveTxHistory({
        hash: '',
        amount,
        asset,
        destination,
        timestamp: new Date().toISOString(),
        status: 'error',
      });

      setMessages(prev => prev.map(m =>
        m.id === msgId
          ? { ...m, txPending: undefined, txResult: { status: 'error', message: errMsg } }
          : m
      ));
      toast({ title: 'Transaction failed', description: errMsg, variant: 'destructive' });
    } finally {
      setActiveTxId(null);
    }
  };

  const handleCancelTx = (msgId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, txPending: undefined, txResult: { status: 'error', message: 'Cancelled by user' } } : m
    ));
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);

    setTyping(true);
    await new Promise(r => setTimeout(r, 500 + Math.random() * 300));
    setTyping(false);

    const response = parseCommand(msg);
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content || '',
      action: response.action,
      txPending: response.txPending,
    };
    setMessages(prev => [...prev, aiMsg]);
  };

  if (showPinFor) {
    return (
      <div className="max-w-md mx-auto">
        <PinLock mode="verify" onSuccess={handlePinSuccess} onCancel={() => { setShowPinFor(null); updateTxStatus(showPinFor, 'awaiting'); }} title="Confirm Payment" />
      </div>
    );
  }

  const renderTxCard = (msg: Message) => {
    if (!msg.txPending) return null;
    const { destination, amount, asset, status } = msg.txPending;
    const isProcessing = status && !['awaiting', 'pin'].includes(status);
    const statusInfo = status ? STATUS_LABELS[status] : null;

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="mt-3 bg-secondary/30 rounded-xl p-3 space-y-2.5 border border-border/30">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">To</span>
          <span className="text-foreground font-mono">{destination.slice(0, 8)}...{destination.slice(-6)}</span>
        </div>
        <div className="flex justify-between text-xs">
