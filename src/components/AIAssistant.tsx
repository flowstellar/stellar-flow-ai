import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, ArrowUpRight, BarChart3, CalendarClock, CheckCircle2, Loader2, XCircle, Clock, Zap, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { usePin } from '@/hooks/usePin';
import { stellarApi } from '@/lib/stellarApi';
import PinLock from './PinLock';

const MIN_ACCOUNT_BALANCE_XLM = 1;

interface TxPending {
  destination: string;
  amount: string;
  asset: string;
  memo?: string;
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

const renderInlineMarkdown = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else {
      nodes.push(
        <code key={key++} className="text-xs bg-secondary/50 px-1 py-0.5 rounded">
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
};

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

  const checkMinimumForNewAccount = async (destination: string, amount: string, asset: string) => {
    if (asset !== 'XLM') return null;
    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum)) return null;
    try {
      const destRes = await stellarApi.getAccount(destination);
      if (destRes.ok) return null;
    } catch {
      return null;
    }
    if (amountNum < MIN_ACCOUNT_BALANCE_XLM) {
      return `This destination account doesn't exist yet. Stellar requires a minimum starting balance of **${MIN_ACCOUNT_BALANCE_XLM} XLM** to create a new account. Please send at least ${MIN_ACCOUNT_BALANCE_XLM} XLM, or fund the account first.`;
    }
    return null;
  };

  const parseCommand = (text: string): Partial<Message> => {
    const lower = text.toLowerCase();

    // Send command — "send 5 xlm to GXXX..."
    const sendMatch = text.match(/send\s+(\d+\.?\d*)\s*(xlm|usdc|eurc)?\s*(?:to\s+)?(G[A-Z0-9]{50,})/i);
    if (sendMatch) {
      const [, amount, rawAsset, destination] = sendMatch;
      const asset = (rawAsset || 'XLM').toUpperCase();
      const amountNum = parseFloat(amount);
      if (asset === 'XLM' && Number.isFinite(amountNum) && amountNum < MIN_ACCOUNT_BALANCE_XLM) {
        return {
          content: `⚠️ **Minimum balance required**\n\nIf \`${destination.slice(0, 8)}...${destination.slice(-6)}\` doesn't exist yet, Stellar requires a minimum starting balance of **${MIN_ACCOUNT_BALANCE_XLM} XLM** to create the account.\n\nYou asked to send **${amount} ${asset}**, which is below that minimum. Please send at least **${MIN_ACCOUNT_BALANCE_XLM} XLM**, or fund the destination account first.`,
        };
      }
      return {
        content: `🔄 **Transaction Request**\n\nI'll send **${amount} ${asset}** to:\n\`${destination.slice(0, 8)}...${destination.slice(-6)}\``,
        txPending: { destination, amount, asset, status: 'awaiting' },
      };
    }

    // Loose send without valid address
    const looseSend = lower.match(/send\s+(\d+\.?\d*)\s*(xlm|usdc|eurc)?\s*(to\s+)?(.+)?/i);
    if (looseSend) {
      const amount = looseSend[1];
      const asset = (looseSend[2] || 'XLM').toUpperCase();
      const who = looseSend[4]?.trim() || 'someone';
      return {
        content: `I'd love to send **${amount} ${asset}** to **${who}**, but I need a valid Stellar address (starts with G, 56 characters).\n\nTry: *\"Send ${amount} ${asset} to GABC...XYZ\"*`,
      };
    }

    // Transaction history
    if (lower.includes('history') || (lower.includes('transaction') && !lower.includes('send'))) {
      const history = loadTxHistory();
      if (history.length === 0) {
        return { content: "📭 No transactions yet. Send your first payment and it'll show up here!\n\nTry: *\"Send 5 XLM to G...\"*" };
      }
      const lines = history.slice(0, 5).map((tx, i) =>
        `${i + 1}. **${tx.amount} ${tx.asset}** → \`${tx.destination.slice(0, 6)}...${tx.destination.slice(-4)}\` ${tx.status === 'success' ? '✅' : '❌'}\n   ${new Date(tx.timestamp).toLocaleString()}`
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
    const { destination, amount, asset, memo } = msg.txPending;

    try {
      // Pre-flight: enforce minimum balance for new accounts
      const minError = await checkMinimumForNewAccount(destination, amount, asset);
      if (minError) {
        setMessages(prev => prev.map(m =>
          m.id === msgId
            ? { ...m, txPending: undefined, txResult: { status: 'error', message: minError } }
            : m
        ));
        toast({ title: 'Below minimum balance', description: `New accounts require at least ${MIN_ACCOUNT_BALANCE_XLM} XLM.`, variant: 'destructive' });
        return;
      }

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
          <span className="text-muted-foreground">Amount</span>
          <span className="text-foreground font-semibold">{amount} {asset}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Network Fee</span>
          <span className="text-primary">~0.00001 XLM</span>
        </div>

        {/* Status indicator */}
        {isProcessing && statusInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2 border border-primary/20">
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            <span className="text-xs text-primary font-medium">{statusInfo.text}</span>
          </motion.div>
        )}

        {/* Buttons — only show when awaiting */}
        {status === 'awaiting' && (
          <div className="flex gap-2 pt-1">
            <button onClick={() => handleApproveTx(msg.id)}
              className="flex-1 neon-gradient text-primary-foreground text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {isPinSet ? '🔒 Approve' : 'Approve & Send'}
            </button>
            <button onClick={() => handleCancelTx(msg.id)}
              className="px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors">
              Cancel
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  const renderTxResult = (msg: Message) => {
    if (!msg.txResult) return null;
    const { status, hash, message, amount, asset } = msg.txResult;
    const isSuccess = status === 'success';

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className={`mt-3 rounded-xl p-3 border ${isSuccess ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'}`}>
        <div className="flex items-center gap-2">
          {isSuccess ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> : <XCircle className="w-5 h-5 text-destructive shrink-0" />}
          <div>
            <span className={`text-xs font-semibold ${isSuccess ? 'text-primary' : 'text-destructive'}`}>
              {isSuccess ? 'Payment Successful!' : 'Transaction Failed'}
            </span>
            {isSuccess && amount && (
              <p className="text-[10px] text-muted-foreground mt-0.5">Sent {amount} {asset} across borders instantly</p>
            )}
            {!isSuccess && <p className="text-[10px] text-destructive/80 mt-0.5">{message}</p>}
          </div>
        </div>
        {hash && (
          <p className="text-[10px] text-muted-foreground mt-2 font-mono break-all bg-secondary/20 rounded px-2 py-1">
            TX: {hash}
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-6 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg neon-gradient flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">AI Payment Agent</h1>
            <p className="text-[10px] text-primary animate-pulse-glow">Online • Executes real transactions</p>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'neon-gradient text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5' : 'glass-card px-4 py-3 rounded-2xl rounded-bl-md'}`}>
                <p className="text-sm whitespace-pre-line">
                  {renderInlineMarkdown(msg.content)}
                </p>
                {renderTxCard(msg)}
                {renderTxResult(msg)}

                {msg.action && !msg.txPending && !msg.txResult && (
                  <button onClick={() => handleAction(msg.action)}
                    className="mt-2 bg-primary/20 text-primary text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary/30 transition-colors flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" /> {msg.action.label}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        {messages.length === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground">Try a command:</p>
            {EXAMPLE_PROMPTS.map(p => (
              <button key={p.text} onClick={() => sendMessage(p.text)}
                className="w-full glass-card p-3 flex items-center gap-3 text-left hover:bg-secondary/50 transition-colors active:scale-[0.98]">
                <p.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{p.text}</span>
              </button>
            ))}
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-24 pt-2">
        <div className="glass-card flex items-center gap-2 p-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Send 10 XLM to GABC..."
            disabled={!!activeTxId}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none px-2 disabled:opacity-50" />
          <button onClick={() => sendMessage()} disabled={!input.trim() || !!activeTxId}
            className="w-8 h-8 rounded-lg neon-gradient flex items-center justify-center disabled:opacity-30 transition-opacity">
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
