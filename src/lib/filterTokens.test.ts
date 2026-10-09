import { describe, it, expect } from 'vitest';
import { filterTokens } from './filterTokens';
import { TOKENS } from './mockData';

const symbols = (tokens: { symbol: string }[]) => tokens.map((t) => t.symbol);

describe('filterTokens', () => {
  describe('category filter', () => {
    it('returns every token for the "all" category', () => {
      const result = filterTokens({ category: 'all' });
      expect(result).toHaveLength(TOKENS.length);
      expect(symbols(result)).toEqual(symbols(TOKENS));
    });

    it('returns only the stablecoins for the "stablecoins" category', () => {
      const result = filterTokens({ category: 'stablecoins' });
      expect(symbols(result).sort()).toEqual(['EURC', 'USDC']);
    });

    it('returns only the gaming tokens for the "gaming" category', () => {
      const result = filterTokens({ category: 'gaming' });
      expect(symbols(result)).toEqual(['GAME']);
    });

    it('returns only the real-world assets for the "real-world" category', () => {
      const result = filterTokens({ category: 'real-world' });
      expect(result.length).toBe(greaterThan(0));
      expect(result.every((t) => t.category === 'real-world')).toBe(true);
    });
  });

  describe('search filter', () => {
    it('matches the GAME symbol for the query "game"', () => {
      const result = filterTokens({ search: 'game' });
      expect(symbols(result)).toContain('GAME');
    });

    it('matches the HOUSE name for the query "estate"', () => {
      const result = filterTokens({ search: 'estate' });
      expect(symbols(result)).toContain('HOUSE');
    });

    it('matches case-insensitively for an uppercase query', () => {
      const lower = filterTokens({ search: 'game' });
      const upper = filterTokens({ search: 'GAME' });
      expect(symbols(upper)).toEqual(symbols(lower));
      expect(symbols(upper)).toContain('GAME');
    });

    it('returns an empty array for a query with no matches', () => {
      const result = filterTokens({ search: 'no-such-token-xyz' });
      expect(result).toEqual([]);
    });
  });

  it('combines category and search predicates', () => {
    const result = filterTokens({ category: 'gaming', search: 'estate' });
    expect(result).toEqual([]);
  });
});
