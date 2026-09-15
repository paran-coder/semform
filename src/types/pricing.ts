export type PricingCalculationType =
  | "fixed"
  | "quantity"
  | "seconds"
  | "minutes"
  | "hours"
  | "base_plus_quantity"
  | "percentage";

export type PricingRounding = "none" | "1000" | "10000" | "100000";

export type PricingItem = {
  id: string;
  name: string;
  category: string;
  calculationType: PricingCalculationType;
  unit: string;
  basePrice: number;
  unitPrice: number;
  defaultQuantity: number;
  percentage: number;
  internalCost: number;
  visibleOnQuote: boolean;
  sortOrder: number;
};

export type PricingPreset = {
  id: string;
  name: string;
  isDefault: boolean;
  minCharge: number;
  rounding: PricingRounding;
  items: PricingItem[];
  createdAt: string;
  updatedAt: string;
};

export const CALCULATION_LABELS: Record<PricingCalculationType, string> = {
  fixed: "고정금액",
  quantity: "수량 × 단가",
  seconds: "초 × 단가",
  minutes: "분 × 단가",
  hours: "시간 × 단가",
  base_plus_quantity: "기본금액 + 수량 × 단가",
  percentage: "비율 %",
};

export const ROUNDING_LABELS: Record<PricingRounding, string> = {
  none: "사용 안 함",
  "1000": "천원 단위",
  "10000": "만원 단위",
  "100000": "십만원 단위",
};
