"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Check, X } from "lucide-react";
import { CoreDispatcher } from "@/lib/agents";
import { Transaction } from "@/lib/types/finance";

interface TheVoidInputProps {
  onTransactionLogged: (transaction: Transaction) => void;
  onHypotheticalLog?: (transaction: Transaction | null) => void;
  quickCommand?: { text: string; id: number };
  onCommandAction?: (command: string) => void;
  currencySymbol: string;
}

function detectCommandIntent(rawInput: string): "analyze-risk" | "forecast-q3" | null {
  const normalized = rawInput.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("analyze risk")) return "analyze-risk";
  if (normalized.includes("forecast q3")) return "forecast-q3";
  return null;
}

export function TheVoidInput({
  onTransactionLogged,
  onHypotheticalLog,
  quickCommand,
  onCommandAction,
  currencySymbol,
}: TheVoidInputProps) {
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [debouncedInput, setDebouncedInput] = useState("");
  const [preview, setPreview] = useState<Partial<Transaction> | null>(null);
  const [isWhatIfMode, setIsWhatIfMode] = useState(false);
  const [isPendingConfirmation, setIsPendingConfirmation] = useState(false);
  const [commandIntent, setCommandIntent] = useState<"analyze-risk" | "forecast-q3" | null>(null);

  // Typewriter effect for quick commands
  useEffect(() => {
    if (!quickCommand || quickCommand.text === "") return;
    setInput("");
    let i = 0;
    const interval = setInterval(() => {
      setInput((prev) => prev + quickCommand.text.charAt(i));
      i++;
      if (i >= quickCommand.text.length) clearInterval(interval);
    }, 20); // 20ms per character typing speed
    return () => clearInterval(interval);
  }, [quickCommand]);

  // Debounce the input for 800ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInput(input);
    }, 800);

    return () => {
      clearTimeout(handler);
    };
  }, [input]);

  // When debounced input changes, run through dispatcher to see a ghost preview
  useEffect(() => {
    if (!debouncedInput.trim()) {
      setIsThinking(false);
      setPreview(null);
      setCommandIntent(null);
      if (isWhatIfMode && onHypotheticalLog) onHypotheticalLog(null);
      return;
    }

    const detectedIntent = detectCommandIntent(debouncedInput);
    if (detectedIntent) {
      setIsThinking(false);
      setPreview(null);
      setCommandIntent(detectedIntent);
      if (isWhatIfMode && onHypotheticalLog) onHypotheticalLog(null);
      return;
    }

    let isMounted = true;
    setIsThinking(true);

    CoreDispatcher.processInput(debouncedInput).then((res) => {
      if (isMounted) {
        setIsThinking(false);
        // Don't update preview if we are just confirming an existing one
        if (!isPendingConfirmation) {
          setPreview(res || null);
          setCommandIntent(null);
          if (isWhatIfMode && onHypotheticalLog && res) {
            onHypotheticalLog(res as Transaction);
          }
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [debouncedInput, isWhatIfMode, onHypotheticalLog, isPendingConfirmation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    if (commandIntent && onCommandAction) {
      onCommandAction(commandIntent);
      setInput("");
      setPreview(null);
      setDebouncedInput("");
      setCommandIntent(null);
      if (onHypotheticalLog) onHypotheticalLog(null);
      return;
    }

    if (preview && preview.amount && preview.category) {
      if (isWhatIfMode) {
        // In what-if mode, we don't save to ledger, just keeping it in hypothetical preview.
        // But user might want to clear it.
        setInput("");
        setPreview(null);
        setDebouncedInput("");
        if (onHypotheticalLog) onHypotheticalLog(null);
      } else {
        // Trigger Action Card instead of direct submission
        setIsPendingConfirmation(true);
      }
    }
  };

  const handleConfirm = () => {
    onTransactionLogged(preview as Transaction);
    setInput("");
    setPreview(null);
    setDebouncedInput("");
    setIsPendingConfirmation(false);
  };

  const handleCancel = () => {
    setInput("");
    setPreview(null);
    setDebouncedInput("");
    setIsPendingConfirmation(false);
  };

  const handleToggleWhatIf = () => {
    setIsWhatIfMode(!isWhatIfMode);
    if (isWhatIfMode && onHypotheticalLog) {
      onHypotheticalLog(null); // Clear hypothetical when turning off
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto mt-12 group">
      {/* Shimmer Border background */}
      <div className={`absolute -inset-[2px] rounded-2xl bg-[length:200%_100%] z-0 transition-opacity duration-500 ${isThinking ? (isWhatIfMode ? 'bg-gradient-to-r from-purple-500 via-fuchsia-300 to-purple-500 animate-shimmer opacity-100' : 'bg-gradient-to-r from-primary via-emerald-200 to-primary animate-shimmer opacity-100') : 'opacity-0'}`} />

      {/* Main Input Wrapper */}
      <div className={`relative ${isWhatIfMode ? 'bg-purple-950/40' : 'bg-card/80'} backdrop-blur-xl saturate-150 border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 z-10 transition-all duration-300`}>
        <Search className={`w-6 h-6 ${isWhatIfMode ? 'text-purple-400' : 'text-muted-foreground'}`} />
        <div className="flex-1 relative h-10 flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isWhatIfMode ? "What if I spend 2000 on marketing?" : "Type anything... e.g. Spent 50 on Coffee"}
            className="w-full h-full bg-transparent border-none outline-none text-xl text-foreground placeholder:text-muted-foreground z-20 relative"
          />
          <button 
             onClick={handleToggleWhatIf}
             className={`ml-2 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${isWhatIfMode ? 'bg-purple-500/20 text-purple-200 border-purple-500/50' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
          >
            {isWhatIfMode ? 'What-If: ON' : 'What-If: OFF'}
          </button>

          {/* Ghost Preview Box */}
          <AnimatePresence>
            {isPendingConfirmation && preview ? (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute bottom-[140%] left-0 right-0 mx-auto w-full max-w-sm bg-emerald-950/40 backdrop-blur-2xl border border-emerald-400/50 shadow-[0_0_30px_rgba(52,211,153,0.3)] animate-pulse [animation-duration:3s] rounded-2xl p-6 flex flex-col items-center text-center space-y-4"
              >
                <div className="absolute inset-0 rounded-2xl border border-emerald-400/40 animate-[shimmer_2s_infinite] [background:linear-gradient(90deg,transparent,rgba(52,211,153,0.2),transparent)] [background-size:200%_100%] pointer-events-none" />
                <div className="text-emerald-100 text-sm tracking-widest uppercase font-medium relative z-10">Pending Transaction</div>
                <div className="text-4xl font-light text-white font-mono tabular-nums relative z-10">
                  {preview.category === 'Income' ? '+' : '-'}{currencySymbol}{preview.amount?.toFixed(2)}
                </div>
                {preview.currency && (
                  <div className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-white/70 uppercase relative z-10 tracking-widest">
                    Detected: {preview.currency}
                  </div>
                )}
                <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm relative z-10">
                  {preview.category}
                </div>
                <div className="flex gap-4 w-full mt-2 relative z-10">
                  <button onClick={handleCancel} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-300 border border-white/10 hover:border-red-500/30 transition-all flex items-center justify-center gap-2">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button onClick={handleConfirm} className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-100 border border-emerald-500/50 transition-all shadow-[0_0_15px_rgba(52,211,153,0.4)] flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Confirm
                  </button>
                </div>
              </motion.div>
            ) : (preview || isThinking || commandIntent) && input.trim() && !isPendingConfirmation ? (
              <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 5 }}
                 className={`absolute top-14 left-0 w-full ${isWhatIfMode ? 'bg-purple-950/90 border-purple-500/20' : 'bg-card/90 border-white/10'} backdrop-blur-3xl saturate-150 border rounded-xl p-4 shadow-xl pointer-events-none z-10`}
               >
                 {isThinking ? (
                   <div className={`flex items-center gap-2 animate-pulse ${isWhatIfMode ? 'text-purple-400' : 'text-primary'}`}>
                     <Sparkles className="w-5 h-5" />
                     <span>Thinking{isWhatIfMode ? ' (Hypothesis)' : ''}...</span>
                   </div>
                 ) : commandIntent ? (
                   <div className="flex justify-between items-center text-sm font-medium">
                     <span className="px-3 py-1 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/40">
                       {commandIntent === "analyze-risk" ? "Analyze Risk" : "Forecast Q3"}
                     </span>
                     <span className="text-emerald-200/70 text-xs uppercase tracking-wider">
                       Press Enter to execute
                     </span>
                   </div>
                 ) : preview ? (
                   <div className="flex justify-between items-center text-sm font-medium">
                     <span className={`px-3 py-1 rounded-full border ${isWhatIfMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-primary/20 text-primary border-primary/30'}`}>
                       {preview.category}
                     </span>
                     {preview.amount ? (
                       <div className="flex flex-col items-end">
                         <div className="flex items-center gap-2">
                           {preview.confidence && preview.confidence < 0.85 && (
                             <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded flex items-center pr-2">
                               ⚠️ Verify
                             </span>
                           )}
                           <span className="text-xl tracking-tight text-white font-mono tabular-nums">
                            {preview.category === 'Income' ? '+' : '-'}{currencySymbol}{preview.amount.toFixed(2)}
                           </span>
                         </div>
                         {preview.currency && <span className="text-[10px] text-emerald-400/80 mr-1 mt-1 uppercase">Matches {preview.currency}</span>}
                       </div>
                     ) : (
                       <span className="text-muted-foreground italic">No amount detected</span>
                     )}
                   </div>
                 ) : null}
               </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
