"use client";

import { useParams } from "next/navigation";
import { QuoteWizard } from "@/components/quotes/quote-wizard";

export default function EditQuotePage() {
  const params = useParams<{ id: string }>();
  return <QuoteWizard quoteId={params.id} />;
}
