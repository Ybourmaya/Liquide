"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TheVoidInput } from "./TheVoidInput";
import { BentoGrid, BentoGridItem } from "./BentoGrid";
import { CashflowChart } from "./CashflowChart";
import { LiquidReportDocument } from "./LiquidReport";
import { Transaction, TransactionCategory } from "@/lib/types/finance";
import { useFinanceStore } from "@/lib/store";
import { QuickCommandDock } from "./QuickCommandDock";
import { ThreeDLoader } from "./ThreeDLoader";
import { CoreDispatcher } from "@/lib/agents";
import { cn } from "@/lib/utils";
import { 
  Wallet, 
  TrendingUp, 
  Sparkles, 
  Coffee, 
  Car, 
  Gamepad2, 
  ShoppingCart, 
  Home, 
  ArrowUpCircle,
  HelpCircle,
  Trash2,
  Download,
  Loader2,
  X,
  Globe
} from "lucide-react";

export function Dashboard() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSkeletonsLoaded, setIsSkeletonsLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hypotheticalTx, setHypotheticalTx] = useState<Transaction | null>(null);
  const [quickCommand, setQuickCommand] = useState<{ text: string; id: number }>();
  const [selectedCard, setSelectedCard] = useState<'cashflow' | 'spending' | null>(null);
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState<TransactionCategory | "All">("All");

  const transactions = useFinanceStore((state) => state.transactions);
  const insights = useFinanceStore((state) => state.insights);
  const addInsight = useFinanceStore((state) => state.addInsight);
  const removeTransaction = useFinanceStore((state) => state.removeTransaction);
  const getBalance = useFinanceStore((state) => state.getBalance);
  const hasHydrated = useFinanceStore((state) => state.hasHydrated);
  const currency = useFinanceStore((state) => state.currency);
  const setCurrency = useFinanceStore((state) => state.setCurrency);
  
  // Wait for hydration before showing the shimmer load
  useEffect(() => {
    if (hasHydrated) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasHydrated]);

  // Simulate skeleton layout fetching
  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => setIsSkeletonsLoaded(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  const handleTransactionLogged = (transaction: Transaction) => {
    // If the Categorization Agent parses a specific currency, adapt global settings seamlessly.
    if (transaction.currency && transaction.currency !== currency) {
      setCurrency(transaction.currency);
      // Let it trigger insight about currency change
      addInsight(`Note: Currency adapted to ${transaction.currency} based on input.`);
    }

    useFinanceStore.getState().addTransaction(transaction);
    // Generate an insight instantly on entry
    const newInsight = CoreDispatcher.generatePlausibleInsight(transactions, transaction);
    if (!insights.includes(newInsight)) addInsight(newInsight);
    setHypotheticalTx(null);
  };

  const currentBalance = getBalance();

  const getCategoryIcon = (category: TransactionCategory) => {
    switch(category) {
      case "Food/Drink": return <Coffee className="w-4 h-4 text-emerald-400" />;
      case "Transportation": return <Car className="w-4 h-4 text-emerald-500" />;
      case "Entertainment": return <Gamepad2 className="w-4 h-4 text-emerald-300" />;
      case "Shopping": return <ShoppingCart className="w-4 h-4 text-emerald-400" />;
      case "Housing": return <Home className="w-4 h-4 text-emerald-600" />;
      case "Income": return <ArrowUpCircle className="w-4 h-4 text-green-400" />;
      default: return <HelpCircle className="w-4 h-4 text-emerald-800" />;
    }
  };

  const getCategoryBreakdown = () => {
    const breakdown: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.category === "Income") return; 
      breakdown[tx.category] = (breakdown[tx.category] || 0) + tx.amount;
    });
    return Object.entries(breakdown).sort((a,b) => b[1] - a[1]);
  };

  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'DH';

  const transactionCategories: TransactionCategory[] = [
    "Food/Drink",
    "Transportation",
    "Entertainment",
    "Shopping",
    "Housing",
    "Utilities",
    "Income",
    "Uncategorized",
  ];

  const isTransactionCategory = (value: string): value is TransactionCategory => {
    return transactionCategories.includes(value as TransactionCategory);
  };

  const parseInsightCategory = (insight: string): TransactionCategory | null => {
    const catMatch = insight.match(/'([^']+)'/);
    if (catMatch?.[1] && isTransactionCategory(catMatch[1])) return catMatch[1];

    if (/positive net flow detected|income tracking upward/i.test(insight)) return "Income";

    return null;
  };

  const ledgerTransactions =
    ledgerCategoryFilter === "All"
      ? transactions
      : transactions.filter((tx) => tx.category === ledgerCategoryFilter);

  const handleExportLiquidReport = async () => {
    setIsDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const ledgerItemsForExport =
        ledgerCategoryFilter === "All"
          ? transactions
          : transactions.filter((tx) => tx.category === ledgerCategoryFilter);

      const blob = await pdf(
        <LiquidReportDocument
          transactions={ledgerItemsForExport}
          insights={insights}
          currencySymbol={currencySymbol}
          ledgerFilter={ledgerCategoryFilter}
          generatedAtISO={new Date().toISOString()}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const downloadDate = new Date().toISOString().slice(0, 10);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Liquid-Report-${downloadDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
      addInsight("Note: Liquid Report generated and downloaded successfully.");
    } catch (err) {
      console.error("Liquid Report export failed:", err);
      addInsight("Note: Liquid Report export failed. Retry after refresh.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCommandAction = (command: string) => {
    if (command === "analyze-risk") {
      if (transactions.length === 0) {
        addInsight("Note: Risk analysis requires transaction data. Log at least one item.");
        return;
      }

      const incomeTotal = transactions
        .filter((tx) => tx.category === "Income")
        .reduce((sum, tx) => sum + tx.amount, 0);
      const expenseTotal = transactions
        .filter((tx) => tx.category !== "Income")
        .reduce((sum, tx) => sum + tx.amount, 0);

      const spendRatio = incomeTotal > 0 ? (expenseTotal / incomeTotal) * 100 : 100;
      const cappedRisk = Math.min(99, Math.max(5, Math.round(spendRatio)));
      const topExpense = getCategoryBreakdown()[0]?.[0] ?? "Uncategorized";

      const riskBand =
        cappedRisk >= 85 ? "elevated" : cappedRisk >= 65 ? "moderate" : "stable";
      addInsight(
        `Note: Risk model flags '${topExpense}' as primary exposure. Portfolio risk ${riskBand} at ${cappedRisk}%.`
      );
      return;
    }

    if (command === "forecast-q3") {
      if (transactions.length === 0) {
        addInsight("Note: Q3 forecast unavailable until transactions are recorded.");
        return;
      }

      const netFlow = transactions.reduce(
        (sum, tx) => (tx.category === "Income" ? sum + tx.amount : sum - tx.amount),
        0
      );
      const avgNetPerTx = netFlow / transactions.length;
      const projectedQ3Delta = avgNetPerTx * 12;

      const polarity = projectedQ3Delta >= 0 ? "positive" : "negative";
      addInsight(
        `Note: Forecast Q3 models a ${polarity} delta of ${currencySymbol}${Math.abs(projectedQ3Delta).toFixed(2)} based on current flow velocity.`
      );
    }
  };

  const handleQuickCommandSelect = (text: string) => {
    setQuickCommand({ text, id: Date.now() });
    const normalized = text.toLowerCase();
    if (normalized.includes("analyze risk")) handleCommandAction("analyze-risk");
    if (normalized.includes("forecast q3")) handleCommandAction("forecast-q3");
  };

  if (!isLoaded || !hasHydrated) {
    return <ThreeDLoader />;
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center pt-24 pb-32 px-4 space-y-16 animate-in fade-in duration-1000 overflow-x-hidden">
      
      {/* Mesh Gradient Deep Background */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-noise opacity-2 mix-blend-overlay" />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] animate-pulse [animation-duration:10s]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 blur-[150px] animate-pulse [animation-duration:15s]" />
        <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-primary/5 blur-[100px] animate-pulse [animation-duration:8s]" />
      </div>
      
      <div className="w-full max-w-4xl text-center space-y-3 z-10 pt-4 relative">
        {/* Currency Switcher */}
        <motion.div 
          key={currency}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="absolute right-0 top-0 hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md cursor-pointer hover:bg-white/10 transition group"
          onClick={() => {
            const next = currency === 'USD' ? 'EUR' : currency === 'EUR' ? 'MAD' : 'USD';
            setCurrency(next);
          }}
        >
          <Globe className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform duration-500" />
          <span className="text-xs text-emerald-100 font-medium tracking-widest">{currency}</span>
        </motion.div>

        <h1 className="text-5xl md:text-6xl font-medium tracking-tighter text-white drop-shadow-sm">
          Liquid Finance
        </h1>
        <p className="text-lg text-emerald-100/60 font-light max-w-lg mx-auto tracking-wide">
          Manage your wealth at the speed of thought.
        </p>
        
        <div className="pt-10 pb-6 flex flex-col items-center">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400/80 font-medium mb-3">Total Asset Value</p>
          <div className="text-6xl md:text-7xl font-extralight tracking-tighter text-white font-mono inline-block tabular-nums transition-all">
            <span className="text-emerald-500/50 mr-1">{currencySymbol}</span>
            {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="w-full relative z-20 hover:scale-[1.01] transition-transform duration-500 -mt-2">
        <TheVoidInput 
          onTransactionLogged={handleTransactionLogged} 
          onHypotheticalLog={setHypotheticalTx}
          quickCommand={quickCommand}
          onCommandAction={handleCommandAction}
        />
      </div>

      <div className="w-full max-w-6xl pt-8 relative z-10">
        <BentoGrid>
          {/* Charts Card */}
          <BentoGridItem
             layoutId="card-cashflow"
             title="Cash Flow Forecast"
             description="Solid actuals vs dashed AI projections."
             onClick={() => setSelectedCard('cashflow')}
             header={
               <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-gradient-to-br from-emerald-950/40 to-background border border-emerald-900/50 cursor-pointer pointer-events-none">
                 {!isSkeletonsLoaded ? (
                   <div className="w-full h-full animate-pulse bg-emerald-900/30 rounded-xl" />
                 ) : (
                  <CashflowChart
                    data={transactions}
                    hypotheticalTx={hypotheticalTx}
                    currencySymbol={currencySymbol}
                  />
                 )}
               </div>
             }
             icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
             className="md:col-span-2 relative overflow-hidden"
           />

          {/* Spend Categories */}
          <BentoGridItem
            layoutId="card-spending"
            title="Spending Breakdown"
            description="Top areas of recent expenditure."
            onClick={() => setSelectedCard('spending')}
            header={
              <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-4 flex-col gap-3 cursor-pointer pointer-events-none">
                {!isSkeletonsLoaded ? (
                  <div className="w-full h-full animate-pulse bg-emerald-900/30 rounded-xl" />
                ) : (
                  <>
                    {getCategoryBreakdown().slice(0,4).map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between items-center w-full group">
                         <div className="flex items-center gap-2">
                           {getCategoryIcon(cat as TransactionCategory)}
                           <span className="text-sm text-emerald-100 group-hover:text-emerald-300 transition-colors">{cat}</span>
                         </div>
                         <span className="text-emerald-400 font-mono tabular-nums text-sm">{currencySymbol}{amt.toFixed(2)}</span>
                      </div>
                    ))}
                    {getCategoryBreakdown().length === 0 && (
                       <div className="text-emerald-700/50 text-sm m-auto italic">No expenses recorded</div>
                    )}
                  </>
                )}
              </div>
            }
            icon={<Wallet className="w-4 h-4 text-emerald-400" />}
            className="md:col-span-1"
          />

          {/* Transactions List */}
          <BentoGridItem
            title={
              <div className="flex justify-between items-center mr-4 w-full">
                <span>Ledger</span>
                {isSkeletonsLoaded && (
                  <button
                    type="button"
                    onClick={handleExportLiquidReport}
                    disabled={isDownloading}
                    aria-label="Export Liquid Report PDF"
                    className="p-1.5 hover:bg-white/10 rounded-md transition disabled:opacity-50"
                  >
                     {isDownloading ? <Loader2 className="w-4 h-4 text-emerald-300 animate-spin" /> : <Download className="w-4 h-4 text-emerald-400" />}
                  </button>
                )}
              </div>
            }
            description={`${ledgerTransactions.length} record(s) shown.`}
            header={
              <div className="flex flex-1 w-full h-full min-h-[8rem] max-h-[14rem] rounded-xl border border-emerald-900/20 bg-card/50 p-4 overflow-y-auto flex-col gap-2 no-scrollbar relative">
                {!isSkeletonsLoaded ? (
                  <div className="w-full h-full animate-pulse bg-emerald-900/30 rounded-xl" />
                ) : (
                  <>
                    {ledgerCategoryFilter !== "All" && (
                      <div className="mb-2 w-full flex items-center justify-between gap-3 bg-emerald-950/20 border border-emerald-900/30 rounded-lg px-3 py-2">
                        <span className="text-xs font-mono text-emerald-200/90">Filter: {ledgerCategoryFilter}</span>
                        <button
                          type="button"
                          onClick={() => setLedgerCategoryFilter("All")}
                          className="text-xs text-emerald-300/80 hover:text-emerald-200 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                    {ledgerTransactions.map((tx) => (
                      <div key={tx.id} className="group relative flex justify-between items-center text-sm p-3 bg-emerald-950/20 hover:bg-emerald-900/40 rounded-lg border border-emerald-900/30 transition-all duration-300">
                         <div className="flex items-center gap-3">
                           {getCategoryIcon(tx.category)}
                           <div>
                             <div className="text-emerald-50 font-medium flex items-center gap-2">
                               {tx.category}
                               {tx.confidence < 0.85 && (
                                 <span className="text-[10px] leading-none text-yellow-300 bg-yellow-500/20 border border-yellow-500/30 px-1 py-0.5 rounded uppercase tracking-wider">Verify</span>
                               )}
                             </div>
                             <div className="text-xs text-emerald-600/80 max-w-[150px] truncate" title={tx.description}>{tx.description}</div>
                           </div>
                         </div>
                         <div className="flex items-center gap-4">
                           <span className={`font-mono tabular-nums px-2 py-1 rounded bg-black/20 ${tx.category === 'Income' ? 'text-green-400 font-semibold border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]' : 'text-emerald-400'}`}>
                             {tx.category === 'Income' ? '+' : '-'}{currencySymbol}{tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                           </span>
                           <button onClick={() => removeTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/30 text-emerald-600 hover:text-red-400 rounded transition-all">
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                      </div>
                    ))}
                    {ledgerTransactions.length === 0 && (
                      <div className="text-sm text-emerald-700/50 italic m-auto">
                        Awaiting commands...
                      </div>
                    )}
                  </>
                )}
              </div>
            }
            icon={<Wallet className="w-4 h-4 text-emerald-500" />}
            className="md:col-span-2"
          />

          {/* AI Insights Card */}
          <BentoGridItem
            title={
              <div className="flex items-center gap-2">
                <span>Liquid AI Intelligence</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            }
            description="Live pattern matching feed."
            header={
              <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-4 flex-col gap-3 relative overflow-hidden group hover:border-emerald-400/40 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <Sparkles className="w-24 h-24 text-emerald-500" />
                </div>
                {!isSkeletonsLoaded ? (
                  <div className="w-full h-full animate-pulse bg-emerald-900/30 rounded-xl" />
                ) : (
                  <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar w-full h-full pr-1">
                    <AnimatePresence>
                      {insights.map((insight, idx) => {
                        const insightCategory = parseInsightCategory(insight);
                        const nextFilter: TransactionCategory | "All" = insightCategory ?? "All";
                        const isActive =
                          ledgerCategoryFilter === "All"
                            ? insightCategory === null
                            : insightCategory === ledgerCategoryFilter;

                        return (
                          <motion.button
                            key={insight + idx}
                            type="button"
                            onClick={() =>
                              setLedgerCategoryFilter((prev) => (prev === nextFilter ? "All" : nextFilter))
                            }
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            whileHover={{ x: 2, boxShadow: "0 0 28px rgba(16,185,129,0.18)" }}
                            whileTap={{ scale: 0.99 }}
                            className={cn(
                              "relative text-left text-sm text-emerald-50/90 leading-relaxed py-4 pl-4 pr-3 bg-emerald-500/5 rounded-r-xl border border-transparent transition-colors cursor-pointer",
                              isActive && "bg-emerald-500/10 border-emerald-400/40"
                            )}
                          >
                            <div className="absolute left-0 top-[10%] w-[2px] h-[80%] bg-gradient-to-b from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_rgba(52,211,153,1)]" />
                            {insightCategory && (
                              <span className="absolute right-3 top-3 text-[10px] uppercase tracking-wider text-emerald-300/85 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                {insightCategory}
                              </span>
                            )}
                            {insight.startsWith("Note:") ? (
                              <>
                                <span className="font-semibold text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.4)] mr-1 tracking-wide">Note:</span>
                                {insight.substring(5)}
                              </>
                            ) : (
                              <span>{insight}</span>
                            )}
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            }
            icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
            className="md:col-span-1"
          />
        </BentoGrid>
      </div>

      <AnimatePresence>
        {selectedCard === 'cashflow' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div layoutId="card-cashflow" className="w-full max-w-5xl h-[80vh] bg-emerald-950/40 backdrop-blur-3xl border border-emerald-500/30 shadow-2xl rounded-2xl flex flex-col p-6 pointer-events-auto">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="text-2xl font-bold text-emerald-50 flex items-center gap-2"><TrendingUp className="text-emerald-400 w-6 h-6"/> Cash Flow Deep Dive</h2>
                   <p className="text-emerald-400/60 font-mono text-sm mt-1">{transactions.length} Data Points Analyzed</p>
                 </div>
                 <button onClick={() => setSelectedCard(null)} className="p-2 bg-emerald-900/50 hover:bg-emerald-800/80 rounded-full transition"><X className="w-5 h-5 text-emerald-200" /></button>
               </div>
               <div className="flex-1 w-full bg-black/20 rounded-xl p-4 border border-emerald-900/50">
                 <CashflowChart
                   data={transactions}
                   hypotheticalTx={hypotheticalTx}
                   currencySymbol={currencySymbol}
                 />
               </div>
            </motion.div>
          </motion.div>
        )}

        {selectedCard === 'spending' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div layoutId="card-spending" className="w-full max-w-2xl h-auto max-h-[80vh] bg-emerald-950/40 backdrop-blur-3xl border border-emerald-500/30 shadow-2xl rounded-2xl flex flex-col p-6 pointer-events-auto overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="text-2xl font-bold text-emerald-50 flex items-center gap-2"><Wallet className="text-emerald-400 w-6 h-6"/> Detailed Breakdown</h2>
                   <p className="text-emerald-400/60 text-sm mt-1">Interactive interactive composition</p>
                 </div>
                 <button onClick={() => setSelectedCard(null)} className="p-2 bg-emerald-900/50 hover:bg-emerald-800/80 rounded-full transition"><X className="w-5 h-5 text-emerald-200" /></button>
               </div>
               <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar pr-2">
                 {getCategoryBreakdown().map(([cat, amt]) => {
                   const totalSpend = Object.values(getCategoryBreakdown()).reduce((a, b) => a + b[1], 0);
                   const percent = ((amt / totalSpend) * 100).toFixed(1);
                   return (
                     <div key={cat} className="flex flex-col gap-2 p-4 bg-emerald-900/10 hover:bg-emerald-900/30 border border-emerald-800/30 rounded-xl transition-colors group cursor-crosshair">
                        <div className="flex justify-between items-center w-full">
                           <div className="flex items-center gap-3">
                             {getCategoryIcon(cat as TransactionCategory)}
                             <span className="text-base font-medium text-emerald-100 group-hover:text-emerald-300 transition-colors">{cat}</span>
                           </div>
                           <div className="flex items-center gap-4 text-sm">
                             <span className="bg-emerald-950/50 px-2 py-1 rounded text-emerald-400/80 tabular-nums">{percent}%</span>
                             <span className="text-emerald-400 font-mono tabular-nums text-lg">{currencySymbol}{amt.toFixed(2)}</span>
                           </div>
                        </div>
                        <div className="w-full h-1.5 bg-emerald-950/50 rounded-full overflow-hidden mt-1 relative">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${percent}%` }} 
                            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                            className="absolute top-0 left-0 h-full bg-emerald-400/80 group-hover:bg-emerald-400 transition-colors" 
                          />
                        </div>
                     </div>
                   );
                 })}
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuickCommandDock onCommandSelect={handleQuickCommandSelect} />

      <AnimatePresence>
        {isDownloading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ y: 20, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.98 }}
              className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-emerald-950/25 backdrop-blur-2xl p-8 text-center"
            >
              <div className="relative w-24 h-24 [perspective:700px] mx-auto mb-6">
                <motion.div
                  animate={{ rotateX: [0, 360], rotateY: [0, 360], rotateZ: [0, 180] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
                  className="w-full h-full relative [transform-style:preserve-3d]"
                >
                  <div className="absolute inset-0 border-2 border-emerald-400 bg-emerald-900/35 [transform:translateZ(48px)] shadow-[0_0_12px_rgba(52,211,153,0.45)]" />
                  <div className="absolute inset-0 border-2 border-emerald-500 bg-emerald-950/30 [transform:rotateY(180deg)_translateZ(48px)]" />
                  <div className="absolute inset-0 border-2 border-emerald-400 bg-emerald-950/30 [transform:rotateY(90deg)_translateZ(48px)]" />
                  <div className="absolute inset-0 border-2 border-emerald-300 bg-emerald-900/25 [transform:rotateY(-90deg)_translateZ(48px)]" />
                  <div className="absolute inset-0 border-2 border-emerald-300 bg-emerald-800/25 [transform:rotateX(90deg)_translateZ(48px)]" />
                  <div className="absolute inset-0 border-2 border-emerald-600 bg-emerald-950/30 [transform:rotateX(-90deg)_translateZ(48px)]" />
                </motion.div>
              </div>

              <p className="text-emerald-200 text-lg tracking-wide">Rendering Liquid Report</p>
              <p className="text-emerald-400/70 text-sm font-mono mt-2">Compiling ledger + AI insights...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="w-full max-w-4xl z-10">
        <div className="mt-8 flex items-center justify-center gap-3 rounded-full bg-card/40 border border-white/10 backdrop-blur-md px-4 py-2 mx-auto">
          <motion.span
            className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.7)]"
            animate={{ scale: [1, 1.7, 1], opacity: [0.7, 1, 0.85] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-sm font-mono text-emerald-200/85">AI Core: Online</span>
        </div>
      </footer>
      
    </div>
  );
}
