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

export type Quote = {
  id: string;
  quoteNumber: string;
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
  createdAt: string;
  updatedAt: string;
};
