export const USD_BASE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  MAD: 9.3,
  GBP: 0.79,
  JPY: 151.2,
  CAD: 1.36,
  AUD: 1.52,
  CHF: 0.9,
  CNY: 7.24,
  INR: 83.2,
  BRL: 5.42,
  MXN: 16.8,
  AED: 3.67,
  SAR: 3.75,
  TRY: 32.1,
  SGD: 1.35,
  ZAR: 18.1,
  SEK: 10.45,
  NOK: 10.75,
  DKK: 6.86,
  PLN: 3.96,
  HKD: 7.81,
  KRW: 1360,
  NZD: 1.64,
};

export function normalizeCurrencyCode(input?: string): string {
  if (!input) return "USD";
  const code = input.trim().toUpperCase();
  return code.length === 3 ? code : "USD";
}

export function getRateForCurrency(code: string): number {
  const normalized = normalizeCurrencyCode(code);
  return USD_BASE_RATES[normalized] ?? 1;
}

export function convertAmount(amount: number, from: string, to: string): number {
  const fromRate = getRateForCurrency(from);
  const toRate = getRateForCurrency(to);
  if (!Number.isFinite(amount)) return 0;
  if (fromRate <= 0 || toRate <= 0) return amount;
  const amountInUsd = amount / fromRate;
  return amountInUsd * toRate;
}

export function getCurrencySymbol(code: string): string {
  const normalized = normalizeCurrencyCode(code);
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    MAD: "DH",
    GBP: "£",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
    CHF: "CHF",
    CNY: "¥",
    INR: "₹",
    BRL: "R$",
    MXN: "MX$",
    AED: "AED",
    SAR: "SAR",
  };
  return symbols[normalized] ?? normalized;
}

export function formatAmount(amount: number, currencyCode: string): string {
  const normalized = normalizeCurrencyCode(currencyCode);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalized,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${getCurrencySymbol(normalized)}${amount.toFixed(2)}`;
  }
}

