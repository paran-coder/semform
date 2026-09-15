"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRightIcon, PlusIcon, SearchIcon } from "@/components/ui/icons";
import { formatWon } from "@/lib/format";
import { getAllRecords, STORES } from "@/lib/storage/database";
import type { Quote } from "@/types/quote";

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function QuotesManager() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllRecords<Quote>(STORES.quotes)
      .then((records) => setQuotes(records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ko-KR");
    if (!keyword) return quotes;
    return quotes.filter((quote) => [quote.quoteNumber, quote.projectName, quote.client.companyName, quote.client.contactName]
      .some((value) => value.toLocaleLowerCase("ko-KR").includes(keyword)));
  }, [quotes, query]);

  return (
    <div className="quotes-manager">
      <div className="quotes-toolbar">
        <div className="quotes-search"><SearchIcon size={16} /><input aria-label="견적 검색" onChange={(event) => setQuery(event.target.value)} placeholder="고객, 프로젝트, 견적번호 검색" value={query} /></div>
        <Link className="sf-button sf-button--primary sf-button--md" href="/quotes/new"><PlusIcon size={17} /> 새 견적</Link>
      </div>

      {loading ? <div className="quotes-loading">견적을 불러오는 중입니다.</div> : quotes.length === 0 ? (
        <section className="quotes-empty"><p className="eyebrow">첫 견적</p><h2>아직 저장한 견적이 없습니다.</h2><p>고객과 단가 프리셋을 불러와 첫 견적을 만들어보세요.</p><Link className="sf-button sf-button--primary sf-button--lg" href="/quotes/new"><PlusIcon size={18} /> 첫 견적 만들기</Link></section>
      ) : (
        <div className="quotes-table" role="list">
          <div className="quotes-table__head"><span>프로젝트</span><span>고객</span><span>상태</span><span>금액</span><span>수정일</span><span /></div>
          {filtered.map((quote) => (
            <Link className="quotes-table__row" href={`/quotes/${quote.id}`} key={quote.id} role="listitem">
              <span className="quotes-table__project"><strong>{quote.projectName}</strong><small>{quote.quoteNumber}</small></span>
              <span>{quote.client.companyName}</span>
              <span><i className={`quote-status quote-status--${quote.status}`}>{quote.status === "final" ? "확정" : "작성중"}</i></span>
              <b>{formatWon(quote.total)}</b>
              <span>{dateLabel(quote.updatedAt)}</span>
              <ArrowRightIcon size={16} />
            </Link>
          ))}
          {filtered.length === 0 ? <div className="quotes-no-result">검색 결과가 없습니다.</div> : null}
        </div>
      )}
    </div>
  );
}
