export const RATES: Record<string, { rate: number; symbol: string; flag: string }> = {
  USD: { rate: 0.50, symbol: '$', flag: '🇺🇶' },
  GBP: { rate: 0.39, symbol: '£', flag: '🇬🇧' },
  EUR: { rate: 0.46, symbol: '€', flag: '🇪🇪' },
};

export const convertXlm = (amountString: string, currency: string): string => {
  const amount = parseFloat(amountString) || 0;
  const rate = RATES[currency] ?? RATES.USD;
  return (amount * rate.rate).toFixed(2);
};
