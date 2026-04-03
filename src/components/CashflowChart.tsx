"use client";
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import { Transaction } from '@/lib/types/finance';

type ChartDatum = {
  name: string;
  actualBalance: number | null;
  projectedBalance: number | null;
};

interface CashflowChartProps {
  data: Transaction[];
  hypotheticalTx?: Transaction | null;
  currencySymbol: string;
}

function formatCurrency(value: number | undefined, currencySymbol: string): string {
  if (typeof value !== "number") return "—";
  return `${currencySymbol}${value.toFixed(2)}`;
}

function GlassTooltipContent({
  active,
  payload,
  label,
  currencySymbol,
}: Partial<TooltipContentProps<number, string>> & { currencySymbol: string }) {
  const actual =
    payload?.find((p) => p.dataKey === "actualBalance")?.value as number | undefined;
  const projected =
    payload?.find((p) => p.dataKey === "projectedBalance")?.value as number | undefined;

  return (
    <AnimatePresence>
      {active && payload && payload.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="pointer-events-none select-none rounded-xl border border-emerald-500/20 bg-black/35 backdrop-blur-xl px-3 py-2 shadow-[0_0_28px_rgba(16,185,129,0.18)]"
        >
          <div className="text-[11px] font-mono text-emerald-200/90 mb-1">{String(label ?? "")}</div>
          <div className="flex flex-col gap-1">
            {typeof actual === "number" && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-emerald-300/80">Actual</span>
                <span className="text-[11px] font-mono text-emerald-100">
                  {formatCurrency(actual, currencySymbol)}
                </span>
              </div>
            )}
            {typeof projected === "number" && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-purple-300/80">Projected</span>
                <span className="text-[11px] font-mono text-purple-100">
                  {formatCurrency(projected, currencySymbol)}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CashflowChart({
  data: transactions,
  hypotheticalTx,
  currencySymbol,
}: CashflowChartProps) {
  // Compute rolling balance over time (chronological). We should reverse because transactions is prepended.
  const chartData = useMemo(() => {
    let balance = 0;
    const sorted = [...transactions].reverse();
    const actuals: ChartDatum[] = sorted.map((tx, index) => {
      balance = tx.category === 'Income' ? balance + tx.amount : balance - tx.amount;
      return {
        name: `Tx ${index + 1}`,
        actualBalance: balance,
        projectedBalance: null, // No projection in the past
      };
    });

    if (actuals.length === 0) {
      return [{ name: 'Start', actualBalance: 0, projectedBalance: 0 }];
    }

    // Connect actual to projection cleanly
    const lastActual = actuals[actuals.length - 1];
    lastActual.projectedBalance = lastActual.actualBalance;

    // AI Projection (extrapolating average spend rate roughly)
    let currentProjBalance = lastActual.actualBalance || 0;
    
    // Apply hypothetical transaction instantly onto the projection line
    if (hypotheticalTx) {
      currentProjBalance = hypotheticalTx.category === 'Income' ? currentProjBalance + hypotheticalTx.amount : currentProjBalance - hypotheticalTx.amount;
    }

    // Determine basic trend from last few transactions
    let trend = 0;
    if (sorted.length > 1) {
       const recentTxs = sorted.slice(-3);
       const netChange = recentTxs.reduce((acc, tx) => tx.category === 'Income' ? acc + tx.amount : acc - tx.amount, 0);
       trend = netChange / recentTxs.length; // Average change per recent tx
    } else if (sorted.length === 1) {
       trend = sorted[0].category === 'Income' ? sorted[0].amount : -sorted[0].amount;
    }

    const projections: ChartDatum[] = [];
    for (let i = 1; i <= 3; i++) {
        // Apply the calculated trend plus a tiny bit of noise
        currentProjBalance += (trend + (Math.random() * 10 - 5));
        projections.push({
          name: `Forecast ${i}`,
          actualBalance: null,
          projectedBalance: currentProjBalance,
        });
    }

    return [...actuals, ...projections];
  }, [transactions, hypotheticalTx]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#064e3b" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#3b0764" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#047857', fontSize: 12 }}
          dy={10}
        />
        <YAxis hide />
        <Tooltip
          content={<GlassTooltipContent currencySymbol={currencySymbol} />}
          filterNull
        />
        <Area 
          type="monotone" 
          dataKey="actualBalance" 
          stroke="#10b981" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorActual)" 
          connectNulls
        />
        <Area 
          type="monotone" 
          dataKey="projectedBalance" 
          stroke="#a855f7" 
          strokeWidth={2}
          strokeDasharray="5 5"
          fillOpacity={1} 
          fill="url(#colorProjected)" 
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
