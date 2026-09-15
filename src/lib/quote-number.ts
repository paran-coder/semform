import type { Quote } from "@/types/quote";

export function generateQuoteNumber(existing: Quote[], date = new Date()) {
  const year = date.getFullYear();
  const max = existing.reduce((current, quote) => {
    const match = quote.quoteNumber?.match(new RegExp(`^Q-${year}-(\\d+)$`));
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `Q-${year}-${String(max + 1).padStart(4, "0")}`;
}
