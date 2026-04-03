import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Transaction, TransactionCategory } from "@/lib/types/finance";

export interface LiquidReportDocumentProps {
  transactions: Transaction[];
  insights: string[];
  currencySymbol: string;
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
    gap: 16,
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

function formatAmount(tx: Transaction, currencySymbol: string): string {
  const sign = tx.category === "Income" ? "+" : "-";
  return `${sign}${currencySymbol}${tx.amount.toFixed(2)}`;
}

function truncate(input: string, maxChars: number): string {
  if (input.length <= maxChars) return input;
  return `${input.slice(0, maxChars - 1)}…`;
}

export function LiquidReportDocument({
  transactions,
  insights,
  currencySymbol,
  ledgerFilter,
  generatedAtISO,
}: LiquidReportDocumentProps) {
  const generatedAtLabel = formatDate(generatedAtISO);
  const ledgerItems = transactions.slice(0, 30);
  const remaining = Math.max(0, transactions.length - ledgerItems.length);
  const insightItems = insights.slice(0, 10);

  const ledgerFilterLabel = ledgerFilter === "All" ? "All categories" : ledgerFilter;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.background} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Liquid Report</Text>
            <Text style={styles.subtitle}>
              Dark-emerald export for {generatedAtLabel}
            </Text>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Ledger</Text>
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
                        {formatAmount(tx, currencySymbol)}
                      </Text>
                    </View>
                    <Text style={styles.description}>{truncate(tx.description, 140)}</Text>
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

