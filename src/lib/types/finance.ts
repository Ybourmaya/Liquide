export type TransactionCategory =
  | "Food/Drink"
  | "Transportation"
  | "Entertainment"
  | "Shopping"
  | "Housing"
  | "Utilities"
  | "Income"
  | "Uncategorized";

export type Currency = string;

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: TransactionCategory;
  date: string;
  confidence: number;
  currency?: Currency;
}

export interface Insight {
  id: string;
  type: "warning" | "success" | "info";
  message: string;
  impact?: number;
}
