"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import { formatWon } from "@/lib/format";
import { getAllRecords, STORES } from "@/lib/storage/database";
import type { Quote } from "@/types/quote";

function shortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export function RecentQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  useEffect(() => { void getAllRecords<Quote>(STORES.quotes).then((records) => setQuotes(records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3))); }, []);

  return (
    <section className="dashboard-section dashboard-section--recent" aria-labelledby="recent-heading">
      <div className="section-heading-row section-heading-row--recent"><div><p className="eyebrow">최근 견적</p><h2 id="recent-heading" className="sr-only">최근 견적 목록</h2></div><Link className="inline-link" href="/quotes">전체 보기<ChevronRightIcon size={15} /></Link></div>
      {quotes.length ? <div className="quote-list" role="list">{quotes.map((quote) => <Link className="quote-row" href={`/quotes/${quote.id}`} key={quote.id} role="listitem"><div className="quote-row__main"><span className="quote-row__client">{quote.client.companyName}</span><span className="quote-row__project">{quote.projectName}</span><span className="quote-row__meta">{quote.quoteNumber}</span></div><div className="quote-row__side"><strong className="quote-row__amount">{formatWon(quote.total)}</strong><span className="quote-row__date">{shortDate(quote.updatedAt)}</span></div><span className="quote-row__chevron"><ChevronRightIcon size={18} /></span></Link>)}</div> : <div className="dashboard-recent-empty">아직 저장한 견적이 없습니다. <Link href="/quotes/new">첫 견적 만들기 →</Link></div>}
    </section>
  );
}
