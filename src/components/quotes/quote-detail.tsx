"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRightIcon, DownloadIcon } from "@/components/ui/icons";
import { formatWon } from "@/lib/format";
import { createId } from "@/lib/ids";
import { createQuoteFile, downloadJsonFile, safeFilename } from "@/lib/storage/backup";
import { generateQuoteNumber } from "@/lib/quote-number";
import { deleteRecord, getAllRecords, getRecord, putRecord, STORES } from "@/lib/storage/database";
import { CALCULATION_LABELS } from "@/types/pricing";
import { quoteToPayload, type Quote, type QuoteItem, type QuotePayload } from "@/types/quote";

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function groupItems(items: QuoteItem[]) {
  const groups: Array<{ category: string; items: QuoteItem[] }> = [];
  for (const item of items) {
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

function lineDescription(item: QuoteItem) {
  if (item.calculationType === "fixed") return "고정금액";
  if (item.calculationType === "percentage") return `기준금액의 ${item.percentage}%`;
  if (item.calculationType === "base_plus_quantity") return `${formatWon(item.basePrice)} + ${item.quantity}${item.unit} × ${formatWon(item.unitPrice)}`;
  return `${item.quantity}${item.unit} × ${formatWon(item.unitPrice)}`;
}

function calculationLine(item: QuoteItem) {
  if (item.calculationType === "fixed") return "고정금액";
  return `${CALCULATION_LABELS[item.calculationType]} · ${lineDescription(item)}`;
}

export function QuoteDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    getRecord<Quote>(STORES.quotes, params.id).then(setQuote).finally(() => setLoading(false));
  }, [params.id]);

  const currentVersion = quote?.version ?? 1;
  const history = useMemo(() => (quote?.versions ?? []).slice().sort((a, b) => b.version - a.version), [quote]);
  const historical = viewingVersion === null ? null : history.find((entry) => entry.version === viewingVersion) ?? null;
  const data: QuotePayload | null = historical?.payload ?? (quote ? quoteToPayload(quote) : null);
  const itemGroups = useMemo(() => groupItems(data?.items ?? []), [data]);

  async function toggleFinal() {
    if (!quote || historical) return;
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

  function exportQuote() {
    if (!quote) return;
    const file = createQuoteFile(quote);
    downloadJsonFile(file, `${quote.quoteNumber}_${safeFilename(quote.projectName)}.quote.json`);
  }

  async function duplicateFrom(payload: QuotePayload) {
    if (!quote || working) return;
    setWorking(true);
    const all = await getAllRecords<Quote>(STORES.quotes);
    const timestamp = new Date().toISOString();
    const id = createId("quote");
    const duplicate: Quote = {
      id,
      quoteNumber: generateQuoteNumber(all),
      version: 1,
      versions: [],
      ...payload,
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await putRecord(STORES.quotes, duplicate);
    setWorking(false);
    router.push(`/quotes/${id}/edit`);
  }

  if (loading) return <div className="quote-detail-loading">견적을 불러오는 중입니다.</div>;
  if (!quote || !data) return <div className="quote-detail-not-found"><h1>견적을 찾을 수 없습니다.</h1><Link href="/quotes">견적 목록으로 돌아가기 →</Link></div>;

  const visibleVersion = historical?.version ?? currentVersion;
  const visibleDate = historical?.savedAt ?? quote.updatedAt;

  return (
    <div className="quote-detail-page">
      <header className="quote-detail-topbar"><Link href="/quotes">← 견적 목록</Link><span>{quote.quoteNumber} · v{visibleVersion}</span></header>
      <div className="quote-detail-content">
        {historical ? <div className="quote-version-preview-banner"><span>v{historical.version} 기록을 보고 있습니다.</span><button onClick={() => setViewingVersion(null)} type="button">현재 v{currentVersion}로 돌아가기</button></div> : null}

        <div className="quote-detail-hero">
          <div><p className="eyebrow">{historical ? "이전 버전" : data.status === "final" ? "확정 견적" : "작성중 견적"}</p><h1>{data.projectName}</h1><p>{data.client.companyName}{data.client.contactName ? ` · ${data.client.contactName}` : ""}</p></div>
          <div className="quote-detail-hero__total"><span>총 견적금액</span><strong>{formatWon(data.total)}</strong><small>VAT {data.vatEnabled ? `${data.vatRate}% 포함` : "미적용"}</small></div>
        </div>

        <div className="quote-detail-actions">
          {historical ? <button className="sf-button sf-button--primary sf-button--md" disabled={working} onClick={() => duplicateFrom(historical.payload)} type="button">이 버전으로 복제</button> : <>
            <Link className="sf-button sf-button--primary sf-button--md" href={`/quotes/${quote.id}/print`}>PDF 저장 / 인쇄</Link>
            <Link className="sf-button sf-button--secondary sf-button--md" href={`/quotes/${quote.id}/edit`}>견적 수정</Link>
            <button className="sf-button sf-button--secondary sf-button--md" disabled={working} onClick={() => duplicateFrom(quoteToPayload(quote))} type="button">복제</button>
            <button className="sf-button sf-button--secondary sf-button--md" onClick={exportQuote} type="button"><DownloadIcon size={15} /> 견적 파일</button>
            <button className="sf-button sf-button--secondary sf-button--md" onClick={toggleFinal} type="button">{quote.status === "final" ? "작성중으로 변경" : "견적 확정"}</button>
            <button className={`sf-button sf-button--secondary sf-button--md${deleteConfirm ? " is-danger-confirm" : ""}`} onClick={removeQuote} type="button">{deleteConfirm ? "삭제 확인" : "삭제"}</button>
          </>}
        </div>

        <section className="quote-detail-meta" aria-label="프로젝트 기본 정보">
          <div><span>견적번호</span><strong>{quote.quoteNumber}</strong></div>
          <div><span>버전 / 저장일</span><strong>v{visibleVersion} · {dateLabel(visibleDate)}</strong></div>
          <div><span>납품 예정</span><strong>{data.deliveryDate ? dateLabel(data.deliveryDate) : "미정"}</strong></div>
          <div><span>영상 형식</span><strong>{data.aspectRatio} · {data.resolution}</strong></div>
        </section>

        <section className="quote-detail-block">
          <header className="quote-detail-block__header"><div><p className="eyebrow">제작 범위</p><h2>작업 항목</h2></div><span>{data.items.length}개 항목 · {itemGroups.length}개 분류</span></header>
          <div className="quote-detail-categories">
            {itemGroups.map((group, groupIndex) => (
              <section className="quote-detail-category" key={`${group.category}-${groupIndex}`}>
                <header><span>{String(groupIndex + 1).padStart(2, "0")}</span><div><h3>{group.category}</h3><p>{group.items.length}개 항목</p></div></header>
                <div className="quote-detail-category__items">
                  {group.items.map((item) => <div className="quote-detail-item" key={item.id}><div><strong>{item.name}</strong><small>{calculationLine(item)}</small></div><b>{formatWon(item.lineTotal)}</b></div>)}
                </div>
              </section>
            ))}
          </div>
          <div className="quote-detail-totals quote-detail-totals--strong"><span>공급가액 <b>{formatWon(data.subtotal)}</b></span><span>VAT {data.vatEnabled ? `${data.vatRate}%` : "미적용"} <b>{formatWon(data.vat)}</b></span><strong>총 견적금액 <b>{formatWon(data.total)}</b></strong></div>
        </section>

        <section className="quote-detail-block">
          <header className="quote-detail-block__header"><div><p className="eyebrow">거래 조건</p><h2>{data.termPresetName || "기본 조건"}</h2></div><span>결제 · 수정 · 권리 · 납품</span></header>
          <div className="quote-term-groups">
            <section><div className="quote-term-groups__title"><span>01</span><h3>결제 및 수정</h3></div><div className="quote-detail-facts"><span>계약금 <b>{data.terms.depositPercent}%</b></span><span>잔금 <b>{data.terms.balancePercent}%</b></span><span>기본 수정 <b>{data.terms.revisionCount}회</b></span><span>추가 수정 <b>{formatWon(data.terms.extraRevisionFee)} / 회</b></span><span>유효기간 <b>{data.terms.validDays}일</b></span></div></section>
            <section><div className="quote-term-groups__title"><span>02</span><h3>권리 및 납품</h3></div><div className="quote-detail-copy">{data.terms.usageTerms ? <p><strong>상업적 이용</strong><span>{data.terms.usageTerms}</span></p> : null}{data.terms.copyrightTerms ? <p><strong>저작권 / 권리</strong><span>{data.terms.copyrightTerms}</span></p> : null}{data.terms.sourceFileTerms ? <p><strong>원본 파일</strong><span>{data.terms.sourceFileTerms}</span></p> : null}{data.terms.cancellationTerms ? <p><strong>취소 / 환불</strong><span>{data.terms.cancellationTerms}</span></p> : null}</div></section>
          </div>
        </section>

        {data.projectNotes ? <section className="quote-detail-block quote-detail-notes"><header className="quote-detail-block__header"><div><p className="eyebrow">메모</p><h2>프로젝트 요청사항</h2></div></header><p>{data.projectNotes}</p></section> : null}

        <section className="quote-version-section">
          <header className="quote-detail-block__header"><div><p className="eyebrow">버전 기록</p><h2>견적 버전</h2></div><span>수정할 때마다 이전 금액과 조건을 보관합니다.</span></header>
          <div className="quote-version-list">
            <div className={`quote-version-row${viewingVersion === null ? " is-active" : ""}`}><div><strong>v{currentVersion}</strong><span>현재 버전 · {dateLabel(quote.updatedAt)}</span></div><b>{formatWon(quote.total)}</b><button onClick={() => setViewingVersion(null)} type="button">보기</button></div>
            {history.map((version) => <div className={`quote-version-row${viewingVersion === version.version ? " is-active" : ""}`} key={`${version.version}-${version.savedAt}`}><div><strong>v{version.version}</strong><span>{dateLabel(version.savedAt)}</span></div><b>{formatWon(version.payload.total)}</b><button onClick={() => setViewingVersion(version.version)} type="button">보기</button></div>)}
          </div>
        </section>

        <Link className="quote-detail-client-link" href="/clients">고객 정보 확인 <ArrowRightIcon size={15} /></Link>
      </div>
    </div>
  );
}
