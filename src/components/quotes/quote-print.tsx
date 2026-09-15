"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatWon } from "@/lib/format";
import { getRecord, STORES } from "@/lib/storage/database";
import { CALCULATION_LABELS } from "@/types/pricing";
import { EMPTY_BRAND_PROFILE, type BrandProfile } from "@/types/profile";
import type { Quote, QuoteItem } from "@/types/quote";

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function validUntil(value: string, days: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  date.setDate(date.getDate() + Math.max(0, days));
  return dateLabel(date.toISOString());
}

function groupItems(items: QuoteItem[]) {
  const groups: Array<{ category: string; items: QuoteItem[] }> = [];
  for (const item of items.filter((entry) => entry.visibleOnQuote !== false)) {
    const category = item.category?.trim() || "기타";
    let group = groups.find((entry) => entry.category === category);
    if (!group) {
      group = { category, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

function detailLine(item: QuoteItem) {
  if (item.calculationType === "fixed") return "고정금액";
  if (item.calculationType === "percentage") return `${item.percentage}% 적용`;
  if (item.calculationType === "base_plus_quantity") return `${formatWon(item.basePrice)} + ${item.quantity}${item.unit} × ${formatWon(item.unitPrice)}`;
  return `${item.quantity}${item.unit} × ${formatWon(item.unitPrice)}`;
}

function calculationLine(item: QuoteItem) {
  if (item.calculationType === "fixed") return "고정금액";
  return `${CALCULATION_LABELS[item.calculationType]} · ${detailLine(item)}`;
}

export function QuotePrint() {
  const params = useParams<{ id: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [profile, setProfile] = useState<BrandProfile>(EMPTY_BRAND_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getRecord<Quote>(STORES.quotes, params.id),
      getRecord<BrandProfile>(STORES.profile, "primary"),
    ]).then(([quoteRecord, profileRecord]) => {
      setQuote(quoteRecord);
      if (profileRecord) setProfile(profileRecord);
    }).finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!quote?.quoteNumber) return;
    document.documentElement.style.setProperty("--sf-print-quote-number", `"${quote.quoteNumber}"`);
    return () => {
      document.documentElement.style.removeProperty("--sf-print-quote-number");
    };
  }, [quote?.quoteNumber]);

  const groups = useMemo(() => groupItems(quote?.items ?? []), [quote]);

  if (loading) return <div className="print-loading">견적서를 준비하는 중입니다.</div>;
  if (!quote) return <div className="print-loading">견적을 찾을 수 없습니다.</div>;

  const depositAmount = Math.round(quote.total * quote.terms.depositPercent / 100);
  const balanceAmount = Math.round(quote.total * quote.terms.balancePercent / 100);
  const studioName = profile.studioName || "SEMFORM";

  return (
    <div className="print-shell">
      <div className="print-toolbar" aria-label="견적서 출력 도구">
        <div><Link href={`/quotes/${quote.id}`}>← 견적으로 돌아가기</Link><span>미리보기 · A4</span></div>
        <button onClick={() => window.print()} type="button">PDF 저장 / 인쇄</button>
      </div>

      <main className="studio-quote-sheet">
        <div className="studio-quote-sheet__accent" />
        <header className="studio-quote-header">
          <div className="studio-brand">
            {profile.logoDataUrl ? <img alt={`${studioName} 로고`} src={profile.logoDataUrl} /> : null}
            <strong>{studioName}</strong>
          </div>
          <div className="studio-quote-number"><span>견적번호</span><strong>{quote.quoteNumber}</strong><small>v{quote.version ?? 1}</small></div>
        </header>

        <section className="studio-quote-hero">
          <div><p className="studio-kicker">견적서</p><h1>{quote.projectName}</h1><p>{quote.client.companyName}{quote.client.contactName ? ` · ${quote.client.contactName}` : ""}</p></div>
          <div className="studio-total"><span>총 견적금액</span><strong>{formatWon(quote.total)}</strong><small>{quote.vatEnabled ? `VAT ${quote.vatRate}% 포함` : "VAT 미적용"}</small></div>
        </section>

        <section className="studio-meta-grid">
          <div><span>발행일</span><strong>{dateLabel(quote.updatedAt)}</strong></div>
          <div><span>견적 유효기간</span><strong>{validUntil(quote.updatedAt, quote.terms.validDays)}</strong></div>
          <div><span>납품 예정</span><strong>{quote.deliveryDate ? dateLabel(quote.deliveryDate) : "협의"}</strong></div>
          <div><span>영상 형식</span><strong>{quote.aspectRatio} · {quote.resolution}</strong></div>
        </section>

        <section className="studio-section">
          <header className="studio-section__header"><span>01</span><div><p>제작 범위</p><h2>작업 항목</h2></div></header>
          <div className="studio-category-list">
            {groups.map((group, groupIndex) => (
              <section className="studio-category" key={`${group.category}-${groupIndex}`}>
                <header><span>{String(groupIndex + 1).padStart(2, "0")}</span><h3>{group.category}</h3></header>
                <div>
                  {group.items.map((item) => <div className="studio-line-item" key={item.id}><span><strong>{item.name}</strong><small>{calculationLine(item)}</small></span><b>{formatWon(item.lineTotal)}</b></div>)}
                </div>
              </section>
            ))}
          </div>
          <div className="studio-sum">
            <span>공급가액 <b>{formatWon(quote.subtotal)}</b></span>
            <span>VAT {quote.vatEnabled ? `${quote.vatRate}%` : "미적용"} <b>{formatWon(quote.vat)}</b></span>
            <strong>총 견적금액 <b>{formatWon(quote.total)}</b></strong>
          </div>
        </section>

        <section className="studio-section studio-section--compact">
          <header className="studio-section__header"><span>02</span><div><p>결제</p><h2>결제 조건</h2></div></header>
          <div className="studio-payment-grid">
            <div><span>계약금 {quote.terms.depositPercent}%</span><strong>{formatWon(depositAmount)}</strong></div>
            <div><span>잔금 {quote.terms.balancePercent}%</span><strong>{formatWon(balanceAmount)}</strong></div>
            <div><span>기본 수정</span><strong>{quote.terms.revisionCount}회</strong><small>추가 수정 {formatWon(quote.terms.extraRevisionFee)} / 회</small></div>
          </div>
        </section>

        <section className="studio-section studio-section--compact">
          <header className="studio-section__header"><span>03</span><div><p>거래 조건</p><h2>권리 및 납품</h2></div></header>
          <div className="studio-terms-list">
            {quote.terms.usageTerms ? <p><strong>상업적 이용</strong><span>{quote.terms.usageTerms}</span></p> : null}
            {quote.terms.copyrightTerms ? <p><strong>저작권 / 권리</strong><span>{quote.terms.copyrightTerms}</span></p> : null}
            {quote.terms.sourceFileTerms ? <p><strong>원본 파일</strong><span>{quote.terms.sourceFileTerms}</span></p> : null}
            {quote.terms.cancellationTerms ? <p><strong>취소 / 환불</strong><span>{quote.terms.cancellationTerms}</span></p> : null}
            <p><strong>포트폴리오</strong><span>{quote.terms.portfolioAllowed ? "완성본을 제작자 포트폴리오에 사용할 수 있습니다." : "별도 동의 없이 포트폴리오에 사용하지 않습니다."}</span></p>
          </div>
        </section>

        {quote.projectNotes ? <section className="studio-section studio-section--compact"><header className="studio-section__header"><span>04</span><div><p>요청사항</p><h2>프로젝트 메모</h2></div></header><p className="studio-project-notes">{quote.projectNotes}</p></section> : null}

        <footer className="studio-footer">
          <div><strong>{studioName}</strong><span>{profile.contactName || profile.representativeName}</span></div>
          <div>{profile.phone ? <span>{profile.phone}</span> : null}{profile.email ? <span>{profile.email}</span> : null}{profile.website ? <span>{profile.website}</span> : null}</div>
          {(profile.businessNumber || profile.address) ? <div className="studio-footer__business">{profile.businessNumber ? <span>사업자등록번호 {profile.businessNumber}</span> : null}{profile.address ? <span>{profile.address}</span> : null}</div> : null}
        </footer>
      </main>
    </div>
  );
}
