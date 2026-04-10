import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Transaction, TransactionCategory } from "@/lib/types/finance";
import { convertAmount, formatAmount, normalizeCurrencyCode } from "@/lib/currency";

export interface LiquidReportDocumentProps {
  transactions: Transaction[];
  insights: string[];
  currencyCode: string;
  ledgerFilter: TransactionCategory | "All";
  generatedAtISO: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: "Helvetica",
    backgroundColor: "#020617",
    color: "#e5e7eb",
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#020617",
  },
  content: {
    position: "relative",
    flexDirection: "column",
    gap: 14,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(16, 185, 129, 0.35)",
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: "#34d399",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(52, 211, 153, 0.75)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#10b981",
    marginBottom: 8,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 10,
    backgroundColor: "rgba(2, 44, 34, 0.3)",
    padding: 10,
  },
  summaryLabel: {
    fontSize: 10,
    color: "rgba(229, 231, 235, 0.7)",
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 12,
    color: "#34d399",
    fontWeight: 700,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 11,
    color: "rgba(229, 231, 235, 0.7)",
  },
  metaValue: {
    fontSize: 11,
    color: "rgba(52, 211, 153, 0.85)",
  },
  list: {
    flexDirection: "column",
    gap: 8,
  },
  item: {
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.18)",
    backgroundColor: "rgba(2, 44, 34, 0.35)",
    borderRadius: 10,
    padding: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  category: {
    fontSize: 12,
    fontWeight: 700,
    color: "#e5e7eb",
  },
  amount: {
    fontSize: 12,
    fontFamily: "Courier",
    fontWeight: 700,
  },
  amountPositive: {
    color: "#34d399",
  },
  amountNegative: {
    color: "#6ee7b7",
  },
  description: {
    fontSize: 11,
    color: "rgba(229, 231, 235, 0.8)",
    marginTop: 6,
  },
  date: {
    fontSize: 10,
    color: "rgba(52, 211, 153, 0.7)",
    marginTop: 6,
  },
  empty: {
    fontSize: 12,
    color: "rgba(229, 231, 235, 0.65)",
    fontStyle: "italic",
  },
  insights: {
    flexDirection: "column",
    gap: 10,
  },
  insightText: {
    fontSize: 11,
    color: "rgba(229, 231, 235, 0.9)",
    lineHeight: 1.35,
  },
  notePrefix: {
    fontWeight: 800,
    color: "rgba(52, 211, 153, 0.9)",
  },
  footerHint: {
    fontSize: 10,
    color: "rgba(229, 231, 235, 0.55)",
    marginTop: 4,
  },
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function formatSignedAmount(tx: Transaction, amount: number, currencyCode: string): string {
  const sign = tx.category === "Income" ? "+" : "-";
  return `${sign}${formatAmount(amount, currencyCode)}`;
}

function truncate(input: string, maxChars: number): string {
  if (input.length <= maxChars) return input;
  return `${input.slice(0, maxChars - 1)}…`;
}

export function LiquidReportDocument({
  transactions,
  insights,
  currencyCode,
  ledgerFilter,
  generatedAtISO,
}: LiquidReportDocumentProps) {
  const displayCode = normalizeCurrencyCode(currencyCode);
  const generatedAtLabel = formatDate(generatedAtISO);
  const ledgerItems = transactions.slice(0, 36);
  const remaining = Math.max(0, transactions.length - ledgerItems.length);
  const insightItems = insights.slice(0, 10);
  const spendingByCategory = transactions.reduce<Record<string, number>>((acc, tx) => {
    if (tx.category === "Income") return acc;
    const converted = convertAmount(tx.amount, tx.currency || displayCode, displayCode);
    acc[tx.category] = (acc[tx.category] ?? 0) + converted;
    return acc;
  }, {});

  const totalIncome = transactions
    .filter((tx) => tx.category === "Income")
    .reduce((sum, tx) => sum + convertAmount(tx.amount, tx.currency || displayCode, displayCode), 0);
  const totalExpense = transactions
    .filter((tx) => tx.category !== "Income")
    .reduce((sum, tx) => sum + convertAmount(tx.amount, tx.currency || displayCode, displayCode), 0);
  const netBalance = totalIncome - totalExpense;

  const ledgerFilterLabel = ledgerFilter === "All" ? "All categories" : ledgerFilter;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.background} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Liquid Report</Text>
            <Text style={styles.subtitle}>
              Multi-currency financial history export · {generatedAtLabel}
            </Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={styles.summaryValue}>{formatAmount(totalIncome, displayCode)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={styles.summaryValue}>{formatAmount(totalExpense, displayCode)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Net</Text>
              <Text style={styles.summaryValue}>{formatAmount(netBalance, displayCode)}</Text>
            </View>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Spending Distribution</Text>
            {Object.keys(spendingByCategory).length === 0 ? (
              <Text style={styles.empty}>No spending categories available yet.</Text>
            ) : (
              <View style={styles.list}>
                {Object.entries(spendingByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([category, amount]) => (
                    <View key={category} style={styles.item}>
                      <View style={styles.itemRow}>
                        <Text style={styles.category}>{category}</Text>
                        <Text style={[styles.amount, styles.amountNegative]}>
                          {formatAmount(amount, displayCode)}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>

          <View>
            <Text style={styles.sectionTitle}>Spending History</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Filter</Text>
              <Text style={styles.metaValue}>{ledgerFilterLabel}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Records</Text>
              <Text style={styles.metaValue}>{transactions.length}</Text>
            </View>

            {ledgerItems.length === 0 ? (
              <Text style={styles.empty}>No ledger items to export.</Text>
            ) : (
              <View style={styles.list}>
                {ledgerItems.map((tx) => (
                  <View key={tx.id} style={styles.item}>
                    <View style={styles.itemRow}>
                      <Text style={styles.category}>{tx.category}</Text>
                      <Text
                        style={[
                          styles.amount,
                          tx.category === "Income" ? styles.amountPositive : styles.amountNegative,
                        ]}
                      >
                        {formatSignedAmount(
                          tx,
                          convertAmount(tx.amount, tx.currency || displayCode, displayCode),
                          displayCode
                        )}
                      </Text>
                    </View>
                    <Text style={styles.description}>{truncate(tx.description, 140)}</Text>
                    <Text style={styles.footerHint}>
                      Original: {formatAmount(tx.amount, tx.currency || displayCode)}
                    </Text>
                    <Text style={styles.date}>{formatDate(tx.date)}</Text>
                  </View>
                ))}
                {remaining > 0 && (
                  <Text style={styles.footerHint}>+ {remaining} more item(s) not shown.</Text>
                )}
              </View>
            )}
          </View>

          <View>
            <Text style={styles.sectionTitle}>AI Insights</Text>
            {insightItems.length === 0 ? (
              <Text style={styles.empty}>No insights available.</Text>
            ) : (
              <View style={styles.insights}>
                {insightItems.map((insight, idx) => {
                  const isNote = insight.startsWith("Note:");
                  return (
                    <Text key={`${insight}-${idx}`} style={styles.insightText}>
                      {isNote ? (
                        <>
                          <Text style={styles.notePrefix}>Note:</Text>
                          {insight.substring(5)}
                        </>
                      ) : (
                        insight
                      )}
                    </Text>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

