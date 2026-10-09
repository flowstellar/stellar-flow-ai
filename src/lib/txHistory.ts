export const TX_HISTORY_KEY = 'stellarflow_ai_tx_history';

export const TX_HISTORY_MAX = 50;

export interface TxHistoryEntry {
  hash: string;
  amount: string;
  asset: string;
  destination: string;
  timestamp: number;
  status: string;
  [key: string]: unknown;
}

export function loadTxHistory(): TxHistoryEntry[] {
  try {
    const raw = localStorage.getItem(TX_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TxHistoryEntry[];
  } catch {
    return [];
  }
}

export function saveTxHistory(entry: TxHistoryEntry): TxHistoryEntry[] {
  const history = loadTxHistory();
  const next = [entry, ...history].slice(0, TX_HISTORY_MAX);
  try {
    localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore write failures (e.g. quota exceeded)
  }
  return next;
}
