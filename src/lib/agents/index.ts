import { Transaction, TransactionCategory } from "../types/finance";

export class CoreDispatcher {
  static async processInput(input: string): Promise<Transaction | null> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const lowerInput = input.toLowerCase();

    const amountMatch = lowerInput.match(/(?:spent|cost|paid|gave|got|earned|received|made|)[\s\$€£]*(\d+(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    let currencyFallback: "USD" | "MAD" | "EUR" | undefined = undefined;
    if (lowerInput.match(/(dh|mad|dirham)/)) currencyFallback = "MAD";
    else if (lowerInput.match(/(€|eur|euro)/)) currencyFallback = "EUR";
    else if (lowerInput.match(/(\$|usd|dollar)/)) currencyFallback = "USD";

    let category: TransactionCategory = "Uncategorized";
    let baseConfidence = 0.6; // lower default confidence

    if (lowerInput.match(/(got paid|salary|earned|received|income|made|from client|won|added|deposited|bonus|profit)/)) {
      category = "Income"; baseConfidence = 0.95;
    } else if (lowerInput.match(/(coffee|latte|food|lunch|dinner|restaurant|snack|drink)/)) {
      category = "Food/Drink"; baseConfidence = 0.92;
    } else if (lowerInput.match(/(uber|lyft|taxi|bus|train|gas|flight)/)) {
      category = "Transportation"; baseConfidence = 0.90;
    } else if (lowerInput.match(/(movie|game|concert|ticket|bar)/)) {
      category = "Entertainment"; baseConfidence = 0.88;
    } else if (lowerInput.match(/(groceries|shirt|shoes|amazon|bought)/)) {
      category = "Shopping"; baseConfidence = 0.87;
    } else if (lowerInput.match(/(rent|mortgage|electricity|wifi|water)/)) {
      category = "Housing"; baseConfidence = 0.95;
    }

    // Add some randomization to confidence
    const confidence = Math.min(0.99, baseConfidence - (Math.random() * 0.1));

    if (amount === 0) return null;

    return {
      id: Math.random().toString(36).substring(7),
      amount,
      description: input,
      category,
      date: new Date().toISOString(),
      confidence: parseFloat(confidence.toFixed(2)), 
      currency: currencyFallback,
    };
  }

  static generatePlausibleInsight(transactions: Transaction[], newTx: Transaction): string {
    if (newTx.category === "Income") {
      return `Positive net flow detected. Current income tracking upward.`;
    }

    const categorySum = transactions
      .filter(t => t.category === newTx.category)
      .reduce((acc, t) => acc + t.amount, 0);

    return `Note: Your '${newTx.category}' spending reached $${(categorySum + newTx.amount).toFixed(2)}. This is establishing a new historical baseline.`;
  }
}

