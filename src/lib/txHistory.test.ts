import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadTxHistory,
  saveTxHistory,
  TX_HISTORY_KEY,
  TX_HISTORY_MAX,
  type TxHistoryEntry,
} from './txHistory';

function makeEntry(overrides: Partial<TxHistoryEntry> = {}): TxHistoryEntry {
  return {
    hash: 'abcdef',
    amount: '10.5',
    asset: 'XLM',
    destination: 'GDEMO',
    timestamp: 1700000000000,
    status: 'success',
    ...overrides,
  };
}

describe('txHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns [] when the key is missing', () => {
    expect(localStorage.getItem(TX_HISTORY_KEY)).toBeNull();
    expect(() => loadTxHistory()).not.toThrow();
    expect(loadTxHistory()).toEqual([]);
  });

  it('returns [] when localStorage contains invalid JSON', () => {
    localStorage.setItem(TX_HISTORY_KEY, '{oops');
    expect(() => loadTxHistory()).not.toThrow();
    expect(loadTxHistory()).toEqual([]);
  });

  it('returns [] when the stored value is not an array', () => {
    localStorage.setItem(TX_HISTORY_KEY, JSON.stringify({ not: 'an array' }));
    expect(loadTxHistory()).toEqual([]);
  });

  it('caps history at 50 entries, keeping the newest first', () => {
    for (let i = 0; i < 51; i++) {
      saveTxHistory(makeEntry({ hash: `tx-${i}`, timestamp: 1700000000000 + i }));
    }

    const stored = loadTxHistory();
    expect(stored).length(TX_HISTORY_MAX);
    expect(stored.length).toBe(50);
    expect(stored[0].hash).toBe('tx-50');
    expect(stored[stored.length - 1].hash).toBe('tx-1');
    expect(stored.some((entry) => entry.hash === 'tx-0')).toBe(false);
  });

  it('prepends the most recent entry first', () => {
    saveTxHistory(makeEntry({ hash: 'first' }));
    saveTxHistory(makeEntry({ hash: 'second' }));
    const stored = loadTxHistory();
    expect(stored.map((e)=> e.hash)).toEqual(['second', 'first']);
  });

  it('round-trips an entry preserving all fields', () => {
    const entry = makeEntry({
      hash: 'round-trip-hash',
      amount: '42.0000000',
      asset: 'USDC',
      destination: 'GBRINGEME',
      timestamp: 1712345678901,
      status: 'pending',
    });

    saveTxHistory(entry);
    const [round] = loadTxHistory();

    expect(round).toEqual(entry);
    expect(round.hash).toBe(entry.hash);
    expect(round.amount).toBe(entry.amount);
    expect(round.asset).toBe(entry.asset);
    expect(round.destination).toBe(entry.destination);
    expect(round.timestamp).toBe(entry.timestamp);
    expect(round.status).toBe(entry.status);
  });
});
