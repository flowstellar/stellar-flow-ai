import { TOKENS, Token } from './mockData';

export interface FilterOptions {
  category?: string;
  search?: string;
}

export const filterTokens = (
  { category = 'all', search = '' }: FilterOptions = {},
  tokens: Token[] = TOKENS,
): Token[] => {
  const normalizedQuery = search.trim().toLowerCase();

  return tokens.filter((t) => {
    if (category !== 'all' && t.category !== category) return false;
    if (
      normalizedQuery &&
      !t.name.toLowerCase().includes(normalizedQuery) &&
      !t.symbol.toLowerCase().includes(normalizedQuery)
    ) {
      return false;
    }
    return true;
  });
};
