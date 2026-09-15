export type Client = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  businessNumber: string;
  address: string;
  website: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientQuoteSummary = {
  id: string;
  clientId?: string;
  projectName?: string;
  quoteNumber?: string;
  total?: number;
  status?: string;
  updatedAt?: string;
};
