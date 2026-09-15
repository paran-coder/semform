export type BrandProfile = {
  id: "primary";
  studioName: string;
  representativeName: string;
  contactName: string;
  phone: string;
  email: string;
  businessNumber: string;
  address: string;
  businessType: string;
  businessItem: string;
  website: string;
  blog: string;
  instagram: string;
  youtube: string;
  otherUrl: string;
  logoDataUrl: string;
  updatedAt: string;
};

export const EMPTY_BRAND_PROFILE: BrandProfile = {
  id: "primary",
  studioName: "",
  representativeName: "",
  contactName: "",
  phone: "",
  email: "",
  businessNumber: "",
  address: "",
  businessType: "",
  businessItem: "",
  website: "",
  blog: "",
  instagram: "",
  youtube: "",
  otherUrl: "",
  logoDataUrl: "",
  updatedAt: "",
};
