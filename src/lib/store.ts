import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Transaction, Currency } from "./types/finance";

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
        return get().transactions.reduce((acc, tx) => {
          if (tx.category === "Income") {
            return acc + tx.amount;
          }
          return acc - tx.amount;
        }, 0);
      },
      setCurrency: (currency) => set({ currency }),
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
