import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Transaction, Currency } from "./types/finance";
import { convertAmount, normalizeCurrencyCode } from "./currency";

interface FinanceState {
  transactions: Transaction[];
  insights: string[];
  currency: Currency;
  hasHydrated: boolean;
  addTransaction: (tx: Transaction) => void;
  removeTransaction: (id: string) => void;
  updateTransaction: (id: string, updatedTx: Partial<Transaction>) => void;
  addInsight: (message: string) => void;
  getBalance: () => number;
  setCurrency: (currency: Currency) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      transactions: [],
      insights: [
        "System Initialized. Liquid Finance active.",
      ],
      currency: "USD",
      hasHydrated: false,
      addTransaction: (tx) => {
        set((state) => ({ transactions: [tx, ...state.transactions] }));
      },
      removeTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        }));
      },
      updateTransaction: (id, updatedTx) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updatedTx } : tx
          ),
        }));
      },
      addInsight: (message) => {
         set((state) => ({
           insights: [message, ...state.insights].slice(0, 10), // Keep last 10
         }));
      },
      getBalance: () => {
        const targetCurrency = normalizeCurrencyCode(get().currency);
        return get().transactions.reduce((acc, tx) => {
          const txCurrency = normalizeCurrencyCode(tx.currency);
          const normalizedAmount = convertAmount(tx.amount, txCurrency, targetCurrency);
          if (tx.category === "Income") {
            return acc + normalizedAmount;
          }
          return acc - normalizedAmount;
        }, 0);
      },
      setCurrency: (currency) => set({ currency: normalizeCurrencyCode(currency) }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "liquid-finance-storage",
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);
