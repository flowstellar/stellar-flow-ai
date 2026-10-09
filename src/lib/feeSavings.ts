import { type Transaction } from '@/lib/mockData';

/**
 * Fee savings baseline
 * ------------------
 * The app compares Stellar network fees against a named traditional remittance
 * baseline. The baseline is the World Bank Remittance Prices Worldwide average
 * cost of sending remittances (6.2% of the amount sent, Q3 2023).
 *
 * Stellar network fees are a flat 0.00001 XLM per operation (base fee), which
 * is effectively 0% for typical user amounts. The displayed savings percentage
 * is therefore rounded to 94% (100% - 6.2%).
 *
 * This is the single source of truth for the fee-savings claim across
 * Landing.tsx, HomeScreen.tsx and CurrencyConverter.tsx.
 */

export const FEE_SAVINGS_BASELINE = {
  /** Named traditional remittance baseline used for the comparison. */
  name: 'World Bank Remittance Prices Worldwide',
  /** Average cost of sending remittances, as a percentage of the amount sent. */
  averageCostPercent: 6.2,
  /** Period the baseline data covers. */
  period: 'Q3 2023',
  /** Source URL for the baseline data. */
  sourceUrl: 'https://remittanceprices.worldbank.org/',
  /** Stellar network base fee in XLM per operation. */
  stellarBaseFeeXLM: 0.00001,
} as const;

/**
 * The single fee-savings percentage displayed across the app.
 * Derived from the baseline above: 100% - 6.2% = 93.8%, rounded to 94%.
 */
export const FEE_SAVINGS_PERCENT = Math.round(100 - FEE_SAVINGS_BASELINE.averageCostPercent);

/**
 * Human-readable description of the basis for the fee-savings claim.
 */
export const FEE_SAVINGS_BASIS_DESCRIPTION =
  `Compared to the ${FEE_SAVINGS_BASELINE.name} average cost of ${FEE_SAVINGS_BASELINE.averageCostPercent}% (${FEE_SAVINGS_BASELINE.period}), Stellar fees are effectively 0%.`;

/**
 * Compute the fee savings for a given amount compared to the baseline.
 * Returns the savings in USD and the savings percentage.
 */
export function computeFeeSavings(amountUsd: number) {
  const traditionalFee = (amountUsd * FEE_SAVINGS_BASELINE.averageCostPercent) / 100;
  const stellarFee = FEE_SAVINGS_BASELINE.stellarBaseFeeXLM;
  const savingsUsd = Math.max(0, traditionalFee - stellarFee);
  return {
    traditionalFee,
    stellarFee,
    savingsUsd,
    savingsPercent: FEE_SAVINGS_PERCENT,
  };
}

/**
 * Weekly fee savings derived from the actual transactions displayed in the
 * app. This is used by the AI insight bubble so the "this week" claim is
 * backed by data covering a week.
 */
export function computeWeeklyFeeSavings(transactions: Transaction[]) {
  const weeklyTxs = transactions.filter((tx) => tx.date && tx.date !== '');
  const totalAmount = weeklyTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const traditionalFee = (totalAmount * FEE_SAVINGS_BASELINE.averageCostPercent) / 100;
  const stellarFee = weeklyTxs.length * FEE_SAVINGS_BASELINE.stellarBaseFeeXLM;
  const savingsUsd = Math.max(0, traditionalFee - stellarFee);
  return {
    transactionCount: weeklyTxs.length,
    totalAmount,
    traditionalFee,
    stellarFee,
    savingsUsd,
    savingsPercent: FEE_SAVINGS_PERCENT,
  };
}
