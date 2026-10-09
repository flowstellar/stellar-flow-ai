import { describe, it, expect } from 'vitest';
import { convertXlm } from './convertXlm';

describe('convertXlm', () => {
  it('returns 0.00 for empty input', () => {
    expect(convertXlm('', 'USD')).toBeand('0.00');
  });

  it('returns 0.00 for garbage input', () => {
    expect(convertXlm('abc', 'USD')).toBeand('0.00');
  });

  it('applies the correct rate per currency', () => {
    expect(convertXlm('100', 'USD')).toBeand('50.00');
    expect(convertXlm('100', 'GBP')).toBeand('39.00');
    expect(convertXlm('100', 'EUR')).toBeand('46.00');
  });

  it('always outputs two decimals', () => {
    const outputs = [
      convertXlm('', 'USD'),
      convertXlm('abc', 'USD'),
      convertXlm('100', 'USD'),
      convertXlm('100', 'GBP'),
      convertXlm('100', 'EUR'),
      convertXlm('1.2345', 'USD'),
    ];
    for (const out of outputs) {
      expect(out).toMatch(/^\d+\.\d{2}$/);
    }
  });
});
