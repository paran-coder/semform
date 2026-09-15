export type TermPreset = {
  id: string;
  name: string;
  isDefault: boolean;
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
  notes: string;
  createdAt: string;
  updatedAt: string;
};
