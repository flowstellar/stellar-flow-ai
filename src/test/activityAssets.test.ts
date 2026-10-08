import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { TOKENS } from '../lib/mockData';

const __dirname = dirname(fileURLToPath(import.meta.url));
const activityScreenPath = resolve(__dirname, '../components/ActivityScreen.tsx');

function extractActivityAssets(source: string): string[] {
  const assets: string[] = [];
  const assetRegex = /asset:\s*'([^']+)'/g;
  let match: RegExpExecArray | null;
  while ((match = assetRegex.exec(source)) !== null) {
    assets.push(match[1]);
  }
  return assets;
}

describe('ActivityScreen asset integrity', () => {
  const source = readFileSync(activityScreenPath, 'utf-8');
  const assets = extractActivityAssets(source);

  it('declares at least one asset in the activity list', () => {
    expect(assets.length).toBeGreaterThan(0);
  });

  it('only uses XLM or assets present in TOKENS', () => {
    const knownAssets = new Set(TOKENS.map((token) => token.symbol));
    for (const asset of assets) {
      expect(
        asset === 'XLM' || knownAssets.has(asset),
        `ActivityScreen references unknown asset "${asset}"; add it to TOKENS or replace it`,
      ).toBe(true);
    }
  });
});
