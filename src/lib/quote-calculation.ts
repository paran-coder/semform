import type { PricingItem, PricingPreset, PricingRounding } from "@/types/pricing";
import type { QuoteItem } from "@/types/quote";

export function calculateItemTotal(item: Pick<QuoteItem, "calculationType" | "quantity" | "basePrice" | "unitPrice" | "percentage">, runningSubtotal = 0) {
  switch (item.calculationType) {
    case "fixed":
      return Math.max(0, item.basePrice);
    case "base_plus_quantity":
      return Math.max(0, item.basePrice + item.quantity * item.unitPrice);
    case "percentage":
      return Math.max(0, runningSubtotal * item.percentage / 100);
    case "quantity":
    case "seconds":
    case "minutes":
    case "hours":
      return Math.max(0, item.quantity * item.unitPrice);
    default:
      return 0;
  }
}

export function roundAmount(value: number, rounding: PricingRounding) {
  if (rounding === "none") return Math.round(value);
  const unit = Number(rounding);
  if (!Number.isFinite(unit) || unit <= 0) return Math.round(value);
  return Math.round(value / unit) * unit;
}

export function calculateQuote(items: QuoteItem[], minCharge: number, rounding: PricingRounding, vatEnabled: boolean, vatRate: number) {
  let running = 0;
  const calculatedItems = items.map((item) => {
    const lineTotal = calculateItemTotal(item, running);
    running += lineTotal;
    return { ...item, lineTotal: Math.round(lineTotal) };
  });
  const beforeRounding = Math.max(running, Math.max(0, minCharge));
  const subtotal = Math.max(0, roundAmount(beforeRounding, rounding));
  const vat = vatEnabled ? Math.round(subtotal * Math.max(0, vatRate) / 100) : 0;
  return { items: calculatedItems, subtotal, vat, total: subtotal + vat };
}

export function pricingItemToQuoteItem(item: PricingItem): QuoteItem {
  return {
    id: item.id,
    pricingItemId: item.id,
    name: item.name,
    category: item.category,
    calculationType: item.calculationType,
    unit: item.unit,
    quantity: item.defaultQuantity,
    basePrice: item.basePrice,
    unitPrice: item.unitPrice,
    percentage: item.percentage,
    visibleOnQuote: item.visibleOnQuote,
    lineTotal: 0,
  };
}

export function pricingPresetToQuoteItems(preset: PricingPreset) {
  return preset.items.map(pricingItemToQuoteItem);
}
