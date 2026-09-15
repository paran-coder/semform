"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "@/components/ui/icons";
import { formatWon } from "@/lib/format";
import { deleteRecord, getRecord, putRecord, STORES } from "@/lib/storage/database";
import type { Quote } from "@/types/quote";
import { CALCULATION_LABELS } from "@/types/pricing";

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function QuoteDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    getRecord<Quote>(STORES.quotes, params.id).then(setQuote).finally(() => setLoading(false));
  }, [params.id]);

  async function toggleFinal() {
    if (!quote) return;
    const next: Quote = { ...quote, status: quote.status === "final" ? "draft" : "final", updatedAt: new Date().toISOString() };
    await putRecord(STORES.quotes, next);
    setQuote(next);
  }

  async function removeQuote() {
    if (!quote) return;
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    await deleteRecord(STORES.quotes, quote.id);
    router.push("/quotes");
  }

  if (loading) return <div className="quote-detail-loading">견적을 불러오는 중입니다.</div>;
  if (!quote) return <div className="quote-detail-not-found"><h1>견적을 찾을 수 없습니다.</h1><Link href="/quotes">견적 목록으로 돌아가기 →</Link></div>;

  return (
    <div className="quote-detail-page">
      <header className="quote-detail-topbar"><Link href="/quotes">← 견적 목록</Link><span>{quote.quoteNumber}</span></header>
      <div className="quote-detail-content">
        <div className="quote-detail-hero">
          <div><p className="eyebrow">{quote.status === "final" ? "확정 견적" : "작성중 견적"}</p><h1>{quote.projectName}</h1><p>{quote.client.companyName}{quote.client.contactName ? ` · ${quote.client.contactName}` : ""}</p></div>
          <div className="quote-detail-hero__total"><span>TOTAL</span><strong>{formatWon(quote.total)}</strong></div>
        </div>

        <div className="quote-detail-actions">
          <button className="sf-button sf-button--secondary sf-button--md" onClick={toggleFinal} type="button">{quote.status === "final" ? "작성중으로 변경" : "견적 확정"}</button>
          <button className={`sf-button sf-button--secondary sf-button--md${deleteConfirm ? " is-danger-confirm" : ""}`} onClick={removeQuote} type="button">{deleteConfirm ? "삭제 확인" : "삭제"}</button>
        </div>

        <section className="quote-detail-meta">
          <div><span>견적번호</span><strong>{quote.quoteNumber}</strong></div><div><span>작성일</span><strong>{dateLabel(quote.createdAt)}</strong></div><div><span>납품 예정</span><strong>{quote.deliveryDate || "미정"}</strong></div><div><span>형식</span><strong>{quote.aspectRatio} · {quote.resolution}</strong></div>
        </section>

        <section className="quote-detail-section">
          <div className="quote-detail-section__heading"><p className="eyebrow">제작 내용</p><h2>{quote.items.length}개 항목</h2></div>
          <div className="quote-detail-items">
            {quote.items.map((item, index) => <div className="quote-detail-item" key={item.id}><span className="quote-detail-item__index">{String(index + 1).padStart(2, "0")}</span><span><strong>{item.name}</strong><small>{CALCULATION_LABELS[item.calculationType]}{item.quantity ? ` · ${item.quantity}${item.unit}` : ""}</small></span><b>{formatWon(item.lineTotal)}</b></div>)}
          </div>
          <div className="quote-detail-totals"><span>공급가액 <b>{formatWon(quote.subtotal)}</b></span><span>VAT {quote.vatEnabled ? `${quote.vatRate}%` : "미적용"} <b>{formatWon(quote.vat)}</b></span><strong>TOTAL <b>{formatWon(quote.total)}</b></strong></div>
        </section>

        <section className="quote-detail-section quote-detail-section--terms">
          <div className="quote-detail-section__heading"><p className="eyebrow">조건</p><h2>{quote.termPresetName || "거래 조건"}</h2></div>
          <div className="quote-detail-facts"><span>계약금 <b>{quote.terms.depositPercent}%</b></span><span>잔금 <b>{quote.terms.balancePercent}%</b></span><span>기본 수정 <b>{quote.terms.revisionCount}회</b></span><span>유효기간 <b>{quote.terms.validDays}일</b></span></div>
          <div className="quote-detail-copy">{quote.terms.usageTerms ? <p><strong>상업적 이용</strong>{quote.terms.usageTerms}</p> : null}{quote.terms.copyrightTerms ? <p><strong>권리</strong>{quote.terms.copyrightTerms}</p> : null}{quote.terms.sourceFileTerms ? <p><strong>원본 파일</strong>{quote.terms.sourceFileTerms}</p> : null}</div>
        </section>

        <Link className="quote-detail-client-link" href="/clients">고객 정보 확인 <ArrowRightIcon size={15} /></Link>
      </div>
    </div>
  );
}
