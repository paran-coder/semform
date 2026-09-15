import type { PricingCalculationType, PricingRounding } from "@/types/pricing";

export type QuoteStatus = "draft" | "final";

export type QuoteClientSnapshot = {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  businessNumber: string;
  address: string;
};

export type QuoteItem = {
  id: string;
  pricingItemId?: string;
  name: string;
  category: string;
  calculationType: PricingCalculationType;
  unit: string;
  quantity: number;
  basePrice: number;
  unitPrice: number;
  percentage: number;
  visibleOnQuote: boolean;
  lineTotal: number;
};

export type QuoteTermsSnapshot = {
  name: string;
  depositPercent: number;
  balancePercent: number;
  revisionCount: number;
  extraRevisionFee: number;
  validDays: number;
  usageTerms: string;
  copyrightTerms: string;
  sourceFileTerms: string;
  portfolioAllowed: boolean;
  cancellationTerms: string;
};

export type QuotePayload = {
  status: QuoteStatus;
  clientId: string;
  client: QuoteClientSnapshot;
  projectName: string;
  purpose: string;
  deliveryDate: string;
  aspectRatio: string;
  resolution: string;
  projectNotes: string;
  pricingPresetId: string;
  pricingPresetName: string;
  minCharge: number;
  rounding: PricingRounding;
  items: QuoteItem[];
  termPresetId: string;
  termPresetName: string;
  terms: QuoteTermsSnapshot;
  vatEnabled: boolean;
  vatRate: number;
  subtotal: number;
  vat: number;
  total: number;
};

export type QuoteVersion = {
  version: number;
  savedAt: string;
  payload: QuotePayload;
};

export type Quote = QuotePayload & {
  id: string;
  quoteNumber: string;
  version?: number;
  versions?: QuoteVersion[];
  createdAt: string;
  updatedAt: string;
};

export function quoteToPayload(quote: Quote): QuotePayload {
  return {
    status: quote.status,
    clientId: quote.clientId,
    client: { ...quote.client },
    projectName: quote.projectName,
    purpose: quote.purpose,
    deliveryDate: quote.deliveryDate,
    aspectRatio: quote.aspectRatio,
    resolution: quote.resolution,
    projectNotes: quote.projectNotes,
    pricingPresetId: quote.pricingPresetId,
    pricingPresetName: quote.pricingPresetName,
    minCharge: quote.minCharge,
    rounding: quote.rounding,
    items: quote.items.map((item) => ({ ...item })),
    termPresetId: quote.termPresetId,
    termPresetName: quote.termPresetName,
    terms: { ...quote.terms },
    vatEnabled: quote.vatEnabled,
    vatRate: quote.vatRate,
    subtotal: quote.subtotal,
    vat: quote.vat,
    total: quote.total,
  };
}
