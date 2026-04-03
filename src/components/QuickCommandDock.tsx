"use client";

import { motion } from "framer-motion";
import { Command } from "lucide-react";

interface QuickCommandDockProps {
  onCommandSelect: (text: string) => void;
}

export function QuickCommandDock({ onCommandSelect }: QuickCommandDockProps) {
  const commands = [
    "Add $50 Coffee",
    "Forecast Q3",
    "Analyze Risk",
    "Add $2k Income"
  ];

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 100 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-card/60 backdrop-blur-2xl border border-white/10 px-4 py-2 rounded-full shadow-2xl z-50"
    >
      <div className="flex items-center gap-2 border-r border-white/10 pr-3 text-muted-foreground">
         <Command className="w-4 h-4" />
         <span className="text-xs font-medium uppercase tracking-wider">Magic</span>
      </div>
      <div className="flex gap-2">
        {commands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => onCommandSelect(cmd)}
            className="text-xs font-mono bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-emerald-100/70 border border-white/5 hover:border-emerald-500/30 px-3 py-1.5 rounded-full transition-all duration-300"
          >
            {cmd}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
