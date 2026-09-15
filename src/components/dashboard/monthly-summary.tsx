"use client";

import { useEffect, useMemo, useState } from "react";
import { formatWon } from "@/lib/format";
import { getAllRecords, STORES } from "@/lib/storage/database";
import type { Quote } from "@/types/quote";

export function MonthlySummary() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  useEffect(() => { void getAllRecords<Quote>(STORES.quotes).then(setQuotes); }, []);

  const summary = useMemo(() => {
    const current = new Date();
    const monthly = quotes.filter((quote) => {
      const date = new Date(quote.updatedAt);
      return date.getFullYear() === current.getFullYear() && date.getMonth() === current.getMonth();
    });
    const total = monthly.reduce((sum, quote) => sum + quote.total, 0);
    return {
      period: `${current.getFullYear()}.${String(current.getMonth() + 1).padStart(2, "0")}`,
      items: [
        { label: "견적금액", value: formatWon(total) },
        { label: "견적 수", value: `${monthly.length}건` },
        { label: "평균 견적", value: formatWon(monthly.length ? total / monthly.length : 0) },
      ],
    };
  }, [quotes]);

  return (
    <section className="dashboard-section" aria-labelledby="monthly-heading">
      <div className="section-heading-row"><div><p className="eyebrow">이번 달</p><h2 id="monthly-heading" className="sr-only">이번 달 견적 요약</h2></div><span className="section-period">{summary.period}</span></div>
      <div className="summary-grid">{summary.items.map((item) => <div className="summary-item" key={item.label}><strong className="summary-item__value">{item.value}</strong><span className="summary-item__label">{item.label}</span></div>)}</div>
    </section>
  );
}
