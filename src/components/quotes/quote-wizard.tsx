"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, PlusIcon } from "@/components/ui/icons";
import { formatWon, numberFromInput } from "@/lib/format";
import { createId } from "@/lib/ids";
import { calculateQuote, pricingPresetToQuoteItems } from "@/lib/quote-calculation";
import { generateQuoteNumber } from "@/lib/quote-number";
import { clearLocalDraft, getLocalDraft, saveLocalDraft } from "@/lib/storage/drafts";
import { getAllRecords, getRecord, putRecord, STORES } from "@/lib/storage/database";
import type { Client } from "@/types/client";
import type { PricingCalculationType, PricingPreset, PricingRounding } from "@/types/pricing";
import { CALCULATION_LABELS } from "@/types/pricing";
import { quoteToPayload, type Quote, type QuoteItem, type QuoteTermsSnapshot } from "@/types/quote";
import type { TermPreset } from "@/types/terms";

type WizardStep = 0 | 1 | 2 | 3 | 4;

type QuoteWizardProps = {
  quoteId?: string;
};

type QuoteWizardDraft = {
  step: WizardStep;
  clientId: string;
  projectName: string;
  purpose: string;
  deliveryDate: string;
  aspectRatio: string;
  resolution: string;
  projectNotes: string;
  pricingPresetId: string;
  pricingMinCharge: number;
  pricingRounding: PricingRounding;
  items: QuoteItem[];
  termPresetId: string;
  terms: QuoteTermsSnapshot;
  vatEnabled: boolean;
  vatRate: number;
};

const steps = ["고객", "프로젝트", "제작", "조건", "검토"] as const;

function now() { return new Date().toISOString(); }

function defaultTerms(): QuoteTermsSnapshot {
  return {
    name: "기본 조건",
    depositPercent: 50,
    balancePercent: 50,
    revisionCount: 2,
    extraRevisionFee: 0,
    validDays: 14,
    usageTerms: "",
    copyrightTerms: "",
    sourceFileTerms: "",
    portfolioAllowed: true,
    cancellationTerms: "",
  };
}

function termToSnapshot(preset: TermPreset): QuoteTermsSnapshot {
  return {
    name: preset.name,
    depositPercent: preset.depositPercent,
    balancePercent: preset.balancePercent,
    revisionCount: preset.revisionCount,
    extraRevisionFee: preset.extraRevisionFee,
    validDays: preset.validDays,
    usageTerms: preset.usageTerms,
    copyrightTerms: preset.copyrightTerms,
    sourceFileTerms: preset.sourceFileTerms,
    portfolioAllowed: preset.portfolioAllowed,
    cancellationTerms: preset.cancellationTerms,
  };
}

function newManualItem(): QuoteItem {
  return {
    id: createId("quote-item"),
    name: "추가 작업",
    category: "기타",
    calculationType: "fixed",
    unit: "건",
    quantity: 1,
    basePrice: 0,
    unitPrice: 0,
    percentage: 0,
    visibleOnQuote: true,
    lineTotal: 0,
  };
}

function clientSnapshot(client?: Client) {
  return {
    companyName: client?.companyName ?? "",
    contactName: client?.contactName ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    businessNumber: client?.businessNumber ?? "",
    address: client?.address ?? "",
  };
}

function quoteToDraft(quote: Quote): QuoteWizardDraft {
  return {
    step: 0,
    clientId: quote.clientId,
    projectName: quote.projectName,
    purpose: quote.purpose,
    deliveryDate: quote.deliveryDate,
    aspectRatio: quote.aspectRatio,
    resolution: quote.resolution,
    projectNotes: quote.projectNotes,
    pricingPresetId: quote.pricingPresetId,
    pricingMinCharge: quote.minCharge,
    pricingRounding: quote.rounding,
    items: quote.items.map((item) => ({ ...item })),
    termPresetId: quote.termPresetId,
    terms: { ...quote.terms },
    vatEnabled: quote.vatEnabled,
    vatRate: quote.vatRate,
  };
}

function timeLabel(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

export function QuoteWizard({ quoteId }: QuoteWizardProps) {
  const router = useRouter();
  const draftKey = `quote-wizard:${quoteId ?? "new"}`;
  const [step, setStep] = useState<WizardStep>(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [pricingPresets, setPricingPresets] = useState<PricingPreset[]>([]);
  const [termPresets, setTermPresets] = useState<TermPreset[]>([]);
  const [existingQuotes, setExistingQuotes] = useState<Quote[]>([]);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [clientId, setClientId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [purpose, setPurpose] = useState("SNS 광고");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [resolution, setResolution] = useState("4K");
  const [projectNotes, setProjectNotes] = useState("");
  const [pricingPresetId, setPricingPresetId] = useState("");
  const [pricingMinCharge, setPricingMinCharge] = useState(0);
  const [pricingRounding, setPricingRounding] = useState<PricingRounding>("none");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [termPresetId, setTermPresetId] = useState("");
  const [terms, setTerms] = useState<QuoteTermsSnapshot>(defaultTerms());
  const [vatEnabled, setVatEnabled] = useState(true);
  const [vatRate, setVatRate] = useState(10);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("데이터를 불러오는 중입니다.");
  const latestDraftRef = useRef<QuoteWizardDraft | null>(null);
  const skipDraftSaveRef = useRef(false);

  const selectedClient = clients.find((client) => client.id === clientId);
  const selectedPricing = pricingPresets.find((preset) => preset.id === pricingPresetId);
  const selectedTerms = termPresets.find((preset) => preset.id === termPresetId);

  const totals = useMemo(() => calculateQuote(
    items,
    pricingMinCharge,
    pricingRounding,
    vatEnabled,
    vatRate,
  ), [items, pricingMinCharge, pricingRounding, vatEnabled, vatRate]);

  useEffect(() => {
    async function load() {
      try {
        const [clientRecords, pricingRecords, termRecords, quoteRecords, targetQuote] = await Promise.all([
          getAllRecords<Client>(STORES.clients),
          getAllRecords<PricingPreset>(STORES.pricingPresets),
          getAllRecords<TermPreset>(STORES.termPresets),
          getAllRecords<Quote>(STORES.quotes),
          quoteId ? getRecord<Quote>(STORES.quotes, quoteId) : Promise.resolve(null),
        ]);
        const sortedPricing = pricingRecords.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
        const sortedTerms = termRecords.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
        setClients(clientRecords.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
        setPricingPresets(sortedPricing);
        setTermPresets(sortedTerms);
        setExistingQuotes(quoteRecords);
        setEditingQuote(targetQuote);

        const fresh = new URLSearchParams(window.location.search).get("fresh") === "1";
        if (fresh) await clearLocalDraft(draftKey);
        const localDraft = fresh ? null : await getLocalDraft<QuoteWizardDraft>(draftKey);

        let initial: QuoteWizardDraft | null = localDraft;
        if (!initial && targetQuote) initial = quoteToDraft(targetQuote);

        if (initial) {
          setStep(initial.step);
          setClientId(initial.clientId);
          setProjectName(initial.projectName);
          setPurpose(initial.purpose);
          setDeliveryDate(initial.deliveryDate);
          setAspectRatio(initial.aspectRatio);
          setResolution(initial.resolution);
          setProjectNotes(initial.projectNotes);
          setPricingPresetId(initial.pricingPresetId);
          setPricingMinCharge(initial.pricingMinCharge ?? targetQuote?.minCharge ?? 0);
          setPricingRounding(initial.pricingRounding ?? targetQuote?.rounding ?? "none");
          setItems(initial.items);
          setTermPresetId(initial.termPresetId);
          setTerms(initial.terms);
          setVatEnabled(initial.vatEnabled);
          setVatRate(initial.vatRate);
          setMessage(localDraft ? "작성 중이던 내용을 이어서 불러왔습니다." : "저장된 견적을 편집합니다.");
        } else {
          const searchClient = new URLSearchParams(window.location.search).get("client");
          const initialClient = searchClient && clientRecords.some((client) => client.id === searchClient) ? searchClient : clientRecords[0]?.id ?? "";
          setClientId(initialClient);
          if (sortedPricing[0]) {
            setPricingPresetId(sortedPricing[0].id);
            setPricingMinCharge(sortedPricing[0].minCharge);
            setPricingRounding(sortedPricing[0].rounding);
            setItems(pricingPresetToQuoteItems(sortedPricing[0]));
          }
          if (sortedTerms[0]) {
            setTermPresetId(sortedTerms[0].id);
            setTerms(termToSnapshot(sortedTerms[0]));
          }
          setMessage("견적을 작성할 준비가 되었습니다.");
        }
        setHydrated(true);
        setLoading(false);
      } catch {
        setLoading(false);
        setMessage("브라우저 로컬 데이터를 불러오지 못했습니다.");
      }
    }
    void load();
  }, [draftKey, quoteId]);

  const draftValue = useMemo<QuoteWizardDraft>(() => ({
    step,
    clientId,
    projectName,
    purpose,
    deliveryDate,
    aspectRatio,
    resolution,
    projectNotes,
    pricingPresetId,
    pricingMinCharge,
    pricingRounding,
    items,
    termPresetId,
    terms,
    vatEnabled,
    vatRate,
  }), [step, clientId, projectName, purpose, deliveryDate, aspectRatio, resolution, projectNotes, pricingPresetId, pricingMinCharge, pricingRounding, items, termPresetId, terms, vatEnabled, vatRate]);

  useEffect(() => { latestDraftRef.current = draftValue; }, [draftValue]);

  useEffect(() => {
    if (!hydrated || loading) return;
    const timer = window.setTimeout(() => {
      void saveLocalDraft(draftKey, draftValue).then(() => setMessage(`임시 저장됨 · ${timeLabel()}`)).catch(() => setMessage("임시 저장에 실패했습니다."));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [draftKey, draftValue, hydrated, loading]);

  useEffect(() => () => {
    if (!skipDraftSaveRef.current && latestDraftRef.current) void saveLocalDraft(draftKey, latestDraftRef.current);
  }, [draftKey]);

  function applyPricingPreset(id: string) {
    const preset = pricingPresets.find((item) => item.id === id);
    setPricingPresetId(id);
    if (preset) { setPricingMinCharge(preset.minCharge); setPricingRounding(preset.rounding); setItems(pricingPresetToQuoteItems(preset)); }
  }

  function applyTermPreset(id: string) {
    const preset = termPresets.find((item) => item.id === id);
    setTermPresetId(id);
    if (preset) setTerms(termToSnapshot(preset));
  }

  function updateItem(id: string, patch: Partial<QuoteItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function canContinue(target = step) {
    if (target === 0) return Boolean(selectedClient);
    if (target === 1) return Boolean(projectName.trim());
    if (target === 2) return items.length > 0;
    if (target === 3) return terms.depositPercent + terms.balancePercent === 100;
    return true;
  }

  function canSave() {
    return Boolean(selectedClient && projectName.trim() && items.length > 0 && terms.depositPercent + terms.balancePercent === 100);
  }

  function goToStep(target: WizardStep) {
    if (target <= step) { setStep(target); return; }
    for (let index = 0; index < target; index += 1) {
      if (!canContinue(index as WizardStep)) {
        setStep(index as WizardStep);
        setMessage(index === 0 ? "고객을 선택해 주세요." : index === 1 ? "프로젝트명을 입력해 주세요." : index === 2 ? "제작 항목을 하나 이상 추가해 주세요." : "계약금과 잔금의 합계를 100%로 맞춰 주세요.");
        return;
      }
    }
    setStep(target);
  }

  function nextStep() {
    if (!canContinue()) {
      setMessage(step === 0 ? "고객을 선택해 주세요." : step === 1 ? "프로젝트명을 입력해 주세요." : step === 2 ? "제작 항목을 하나 이상 추가해 주세요." : "계약금과 잔금의 합계를 100%로 맞춰 주세요.");
      return;
    }
    setStep((current) => Math.min(4, current + 1) as WizardStep);
  }

  async function resetDraft() {
    if (!window.confirm("작성 중인 내용을 지우고 처음부터 시작할까요?")) return;
    skipDraftSaveRef.current = true;
    await clearLocalDraft(draftKey);
    window.location.href = quoteId ? `/quotes/${quoteId}/edit?fresh=1` : "/quotes/new?fresh=1";
  }

  async function saveQuote() {
    if (!selectedClient || !projectName.trim()) return;
    setSaving(true);
    setMessage(editingQuote ? "새 버전으로 저장하는 중입니다." : "견적을 저장하는 중입니다.");
    const timestamp = now();
    const payload = {
      status: "draft" as const,
      clientId: selectedClient.id,
      client: clientSnapshot(selectedClient),
      projectName: projectName.trim(),
      purpose: purpose.trim(),
      deliveryDate,
      aspectRatio,
      resolution,
      projectNotes: projectNotes.trim(),
      pricingPresetId,
      pricingPresetName: selectedPricing?.name ?? editingQuote?.pricingPresetName ?? "직접 입력",
      minCharge: pricingMinCharge,
      rounding: pricingRounding,
      items: totals.items,
      termPresetId,
      termPresetName: selectedTerms?.name ?? terms.name,
      terms,
      vatEnabled,
      vatRate,
      subtotal: totals.subtotal,
      vat: totals.vat,
      total: totals.total,
    };

    const quote: Quote = editingQuote ? {
      ...editingQuote,
      ...payload,
      version: (editingQuote.version ?? 1) + 1,
      versions: [
        ...(editingQuote.versions ?? []),
        { version: editingQuote.version ?? 1, savedAt: editingQuote.updatedAt || editingQuote.createdAt, payload: quoteToPayload(editingQuote) },
      ],
      updatedAt: timestamp,
    } : {
      id: createId("quote"),
      quoteNumber: generateQuoteNumber(existingQuotes),
      version: 1,
      versions: [],
      ...payload,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    try {
      await putRecord(STORES.quotes, quote);
      skipDraftSaveRef.current = true;
      await clearLocalDraft(draftKey);
      setSaving(false);
      router.push(`/quotes/${quote.id}`);
    } catch {
      setSaving(false);
      setMessage("견적을 저장하지 못했습니다.");
    }
  }

  if (loading) {
    return <div className="quote-wizard-loading"><span className="save-status__dot" /> 견적 데이터를 불러오는 중입니다.</div>;
  }

  return (
    <div className="quote-wizard">
      <header className="quote-wizard__topbar">
        <div><Link href={editingQuote ? `/quotes/${editingQuote.id}` : "/quotes"}>← {editingQuote ? "견적 상세" : "견적"}</Link><span>{editingQuote ? `${editingQuote.quoteNumber} · v${editingQuote.version ?? 1} 편집` : "새 견적"}</span></div>
        <div className="quote-wizard__top-actions"><span className="quote-wizard__status">{message}</span><button className="quote-reset-button" onClick={resetDraft} type="button">{editingQuote ? "저장본으로 되돌리기" : "처음부터"}</button></div>
      </header>

      <div className="quote-wizard__layout">
        <main className="quote-wizard__main">
          <nav className="quote-steps" aria-label="견적 작성 단계">
            {steps.map((label, index) => (
              <button className={`quote-step${step === index ? " is-active" : ""}${step > index ? " is-done" : ""}`} key={label} onClick={() => goToStep(index as WizardStep)} type="button">
                <span>{index + 1}</span><strong>{label}</strong>
              </button>
            ))}
          </nav>

          <div className="quote-step-panel">
            {step === 0 ? (
              <section className="wizard-section">
                <div className="wizard-section__heading"><p className="eyebrow">01 고객</p><h1>누구에게 보내는 견적인가요?</h1><p>저장된 고객을 선택하면 연락처와 사업자 정보를 견적에 스냅샷으로 보관합니다.</p></div>
                {clients.length ? <>
                  <label className="field wizard-field"><span className="field__label">고객 선택</span><select onChange={(event) => setClientId(event.target.value)} value={clientId}>{clients.map((client) => <option key={client.id} value={client.id}>{client.companyName}{client.contactName ? ` · ${client.contactName}` : ""}</option>)}</select></label>
                  {selectedClient ? <div className="selected-client-card"><div className="selected-client-card__avatar">{selectedClient.companyName.slice(0, 1)}</div><div><strong>{selectedClient.companyName}</strong><span>{selectedClient.contactName || "담당자 미입력"}</span><small>{selectedClient.email || selectedClient.phone || "연락처 미입력"}</small></div><Link href="/clients">고객 관리 →</Link></div> : null}
                </> : <div className="wizard-empty"><strong>저장된 고객이 없습니다.</strong><p>먼저 고객을 한 명 추가한 뒤 견적을 작성해 주세요. 이 화면을 벗어나도 작성 중인 내용은 자동 보관됩니다.</p><Link className="sf-button sf-button--primary sf-button--md" href="/clients"><PlusIcon size={16} /> 고객 추가</Link></div>}
              </section>
            ) : null}

            {step === 1 ? (
              <section className="wizard-section">
                <div className="wizard-section__heading"><p className="eyebrow">02 프로젝트</p><h1>이번 작업의 범위를 적어주세요.</h1><p>프로젝트명과 납품 조건은 최종 견적서의 기본 정보로 사용됩니다.</p></div>
                <div className="form-grid form-grid--2 wizard-form-grid">
                  <label className="field field--span-2"><span className="field__label">프로젝트명 *</span><input autoFocus maxLength={100} onChange={(event) => setProjectName(event.target.value)} placeholder="예: 신제품 AI SNS 광고 영상" value={projectName} /></label>
                  <label className="field"><span className="field__label">제작 목적</span><select onChange={(event) => setPurpose(event.target.value)} value={purpose}><option>SNS 광고</option><option>브랜드 필름</option><option>숏폼 콘텐츠</option><option>제품 영상</option><option>뮤직비디오</option><option>기타</option></select></label>
                  <label className="field"><span className="field__label">납품 예정일</span><input onChange={(event) => setDeliveryDate(event.target.value)} type="date" value={deliveryDate} /></label>
                  <label className="field"><span className="field__label">영상 비율</span><select onChange={(event) => setAspectRatio(event.target.value)} value={aspectRatio}><option>9:16</option><option>16:9</option><option>1:1</option><option>4:5</option><option>기타</option></select></label>
                  <label className="field"><span className="field__label">해상도</span><select onChange={(event) => setResolution(event.target.value)} value={resolution}><option>FHD</option><option>4K</option><option>기타</option></select></label>
                  <label className="field field--span-2"><span className="field__label">고객 요청 / 내부 메모</span><textarea onChange={(event) => setProjectNotes(event.target.value)} placeholder="제작 범위와 특별 요청사항을 적어두세요." rows={5} value={projectNotes} /></label>
                </div>
              </section>
            ) : null}

            {step === 2 ? (
              <section className="wizard-section wizard-section--wide">
                <div className="wizard-section__heading wizard-section__heading--row"><div><p className="eyebrow">03 제작</p><h1>제작 항목과 단가를 확인하세요.</h1><p>프리셋 가격은 이 견적에서만 수정되며 원래 단가 프리셋은 바뀌지 않습니다.</p></div>{pricingPresets.length ? <label className="wizard-preset-select"><span>단가 프리셋</span><select onChange={(event) => applyPricingPreset(event.target.value)} value={pricingPresetId}>{pricingPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label> : null}</div>
                {!pricingPresets.length ? <div className="wizard-empty"><strong>단가 프리셋이 없습니다.</strong><p>프리셋 화면에 다녀와도 지금까지 작성한 견적은 그대로 이어집니다.</p><div><Link className="sf-button sf-button--secondary sf-button--md" href="/pricing">단가 프리셋 만들기</Link><button className="sf-button sf-button--primary sf-button--md" onClick={() => setItems([newManualItem()])} type="button">직접 항목 추가</button></div></div> : null}
                <div className="quote-item-editor-list">
                  {totals.items.map((item, index) => (
                    <article className="quote-item-editor" key={item.id}>
                      <div className="quote-item-editor__head"><span>{String(index + 1).padStart(2, "0")}</span><div><input aria-label="항목명" onChange={(event) => updateItem(item.id, { name: event.target.value })} value={item.name} /><small>{item.category} · {CALCULATION_LABELS[item.calculationType]}</small></div><strong>{formatWon(item.lineTotal)}</strong><button className="inline-danger" onClick={() => removeItem(item.id)} type="button">삭제</button></div>
                      <div className="quote-item-editor__fields">
                        <label className="field"><span className="field__label">분류</span><input onChange={(event) => updateItem(item.id, { category: event.target.value })} value={item.category} /></label>
                        <label className="field"><span className="field__label">계산 방식</span><select onChange={(event) => updateItem(item.id, { calculationType: event.target.value as PricingCalculationType })} value={item.calculationType}>{Object.entries(CALCULATION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                        {item.calculationType !== "fixed" && item.calculationType !== "percentage" ? <label className="field"><span className="field__label">수량</span><div className="suffix-field"><input inputMode="decimal" min="0" onChange={(event) => updateItem(item.id, { quantity: numberFromInput(event.target.value) })} type="number" value={item.quantity} /><span>{item.unit || "단위"}</span></div></label> : null}
                        {item.calculationType === "fixed" || item.calculationType === "base_plus_quantity" ? <label className="field"><span className="field__label">기본금액</span><div className="money-field"><span>₩</span><input inputMode="numeric" min="0" onChange={(event) => updateItem(item.id, { basePrice: numberFromInput(event.target.value) })} type="number" value={item.basePrice} /></div></label> : null}
                        {item.calculationType !== "fixed" && item.calculationType !== "percentage" ? <label className="field"><span className="field__label">단가</span><div className="money-field"><span>₩</span><input inputMode="numeric" min="0" onChange={(event) => updateItem(item.id, { unitPrice: numberFromInput(event.target.value) })} type="number" value={item.unitPrice} /></div></label> : null}
                        {item.calculationType === "percentage" ? <label className="field"><span className="field__label">비율</span><div className="suffix-field"><input inputMode="decimal" min="0" onChange={(event) => updateItem(item.id, { percentage: numberFromInput(event.target.value) })} type="number" value={item.percentage} /><span>%</span></div></label> : null}
                      </div>
                    </article>
                  ))}
                </div>
                <button className="quote-add-item" onClick={() => setItems((current) => [...current, newManualItem()])} type="button"><PlusIcon size={16} /> 직접 항목 추가</button>
              </section>
            ) : null}

            {step === 3 ? (
              <section className="wizard-section wizard-section--wide">
                <div className="wizard-section__heading wizard-section__heading--row"><div><p className="eyebrow">04 조건</p><h1>결제와 거래 조건을 확인하세요.</h1><p>불러온 조건은 이 견적에 복사되어 나중에 프리셋이 바뀌어도 영향을 받지 않습니다.</p></div>{termPresets.length ? <label className="wizard-preset-select"><span>조건 프리셋</span><select onChange={(event) => applyTermPreset(event.target.value)} value={termPresetId}>{termPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label> : <Link className="text-action text-action--link" href="/terms">조건 프리셋 만들기 →</Link>}</div>
                <div className="quote-terms-grid">
                  <div className="quote-terms-card"><span>결제</span><div className="form-grid form-grid--2"><label className="field"><span className="field__label">계약금</span><div className="suffix-field"><input min="0" max="100" onChange={(event) => setTerms((current) => ({ ...current, depositPercent: numberFromInput(event.target.value) }))} type="number" value={terms.depositPercent} /><span>%</span></div></label><label className="field"><span className="field__label">잔금</span><div className="suffix-field"><input min="0" max="100" onChange={(event) => setTerms((current) => ({ ...current, balancePercent: numberFromInput(event.target.value) }))} type="number" value={terms.balancePercent} /><span>%</span></div></label></div><small className={terms.depositPercent + terms.balancePercent === 100 ? "is-ok" : "is-error"}>합계 {terms.depositPercent + terms.balancePercent}%</small></div>
                  <div className="quote-terms-card"><span>수정 / 유효기간</span><div className="form-grid form-grid--2"><label className="field"><span className="field__label">기본 수정</span><div className="suffix-field"><input min="0" onChange={(event) => setTerms((current) => ({ ...current, revisionCount: numberFromInput(event.target.value) }))} type="number" value={terms.revisionCount} /><span>회</span></div></label><label className="field"><span className="field__label">유효기간</span><div className="suffix-field"><input min="1" onChange={(event) => setTerms((current) => ({ ...current, validDays: numberFromInput(event.target.value) }))} type="number" value={terms.validDays} /><span>일</span></div></label><label className="field field--span-2"><span className="field__label">추가 수정 1회</span><div className="money-field"><span>₩</span><input min="0" onChange={(event) => setTerms((current) => ({ ...current, extraRevisionFee: numberFromInput(event.target.value) }))} type="number" value={terms.extraRevisionFee} /></div></label></div></div>
                  <div className="quote-terms-card quote-terms-card--wide"><span>권리 / 납품</span><div className="form-grid"><label className="field"><span className="field__label">상업적 이용</span><textarea onChange={(event) => setTerms((current) => ({ ...current, usageTerms: event.target.value }))} rows={3} value={terms.usageTerms} /></label><label className="field"><span className="field__label">저작권 / 권리</span><textarea onChange={(event) => setTerms((current) => ({ ...current, copyrightTerms: event.target.value }))} rows={3} value={terms.copyrightTerms} /></label><label className="field"><span className="field__label">원본 파일</span><textarea onChange={(event) => setTerms((current) => ({ ...current, sourceFileTerms: event.target.value }))} rows={3} value={terms.sourceFileTerms} /></label></div></div>
                  <div className="quote-terms-card quote-terms-card--wide"><span>세금</span><div className="quote-vat-controls"><label className="check-control"><input checked={vatEnabled} onChange={(event) => setVatEnabled(event.target.checked)} type="checkbox" /><span>부가가치세 적용</span></label>{vatEnabled ? <label className="field"><span className="field__label">VAT</span><div className="suffix-field"><input min="0" onChange={(event) => setVatRate(numberFromInput(event.target.value))} type="number" value={vatRate} /><span>%</span></div></label> : null}</div></div>
                </div>
              </section>
            ) : null}

            {step === 4 ? (
              <section className="wizard-section wizard-section--wide">
                <div className="wizard-section__heading"><p className="eyebrow">05 검토</p><h1>{editingQuote ? "새 버전으로 저장하기 전에 확인하세요." : "저장하기 전에 마지막으로 확인하세요."}</h1><p>{editingQuote ? `저장하면 v${(editingQuote.version ?? 1) + 1}이 생성되고 이전 버전은 기록에 남습니다.` : "견적을 저장하면 고객, 가격, 조건이 현재 값으로 고정됩니다."}</p></div>
                <div className="quote-review">
                  <div className="quote-review__hero"><div><span>{selectedClient?.companyName || "고객 미선택"}</span><h2>{projectName || "프로젝트명 없음"}</h2><p>{purpose} · {aspectRatio} · {resolution}{deliveryDate ? ` · ${deliveryDate}` : ""}</p></div><strong>{formatWon(totals.total)}</strong></div>
                  <div className="quote-review__section"><h3>제작 항목</h3>{totals.items.map((item) => <div className="quote-review__row" key={item.id}><span><strong>{item.name}</strong><small>{item.category} · {CALCULATION_LABELS[item.calculationType]}</small></span><b>{formatWon(item.lineTotal)}</b></div>)}</div>
                  <div className="quote-review__section"><h3>조건</h3><div className="quote-review__facts"><span>계약금 <b>{terms.depositPercent}%</b></span><span>수정 <b>{terms.revisionCount}회</b></span><span>유효기간 <b>{terms.validDays}일</b></span><span>VAT <b>{vatEnabled ? `${vatRate}%` : "미적용"}</b></span></div></div>
                </div>
              </section>
            ) : null}

            <div className="quote-wizard__actions">
              <button className="sf-button sf-button--secondary sf-button--lg" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1) as WizardStep)} type="button">이전</button>
              {step < 4 ? <button className="sf-button sf-button--primary sf-button--lg" onClick={nextStep} type="button">다음 <ArrowRightIcon size={16} /></button> : <button className="sf-button sf-button--primary sf-button--lg" disabled={saving || !canSave()} onClick={saveQuote} type="button">{saving ? "저장 중" : editingQuote ? `v${(editingQuote.version ?? 1) + 1} 저장` : "견적 저장"}</button>}
            </div>
          </div>
        </main>

        <aside className="quote-summary" aria-label="견적 요약">
          <p className="eyebrow">견적 요약</p><span className="quote-summary__label">예상 견적</span><strong className="quote-summary__total">{formatWon(totals.total)}</strong>
          <div className="quote-summary__breakdown"><span>공급가액 <b>{formatWon(totals.subtotal)}</b></span><span>VAT {vatEnabled ? `${vatRate}%` : "미적용"} <b>{formatWon(totals.vat)}</b></span></div>
          <div className="quote-summary__meta"><span>고객 <b>{selectedClient?.companyName || "미선택"}</b></span><span>단가 <b>{selectedPricing?.name || editingQuote?.pricingPresetName || "직접 입력"}</b></span><span>조건 <b>{selectedTerms?.name || terms.name}</b></span></div>
          <div className="quote-summary__progress"><span>{step + 1} / 5</span><div><i style={{ width: `${((step + 1) / 5) * 100}%` }} /></div></div>
        </aside>
      </div>

      <div className="quote-mobile-total"><div><span>예상 견적</span><strong>{formatWon(totals.total)}</strong></div>{step < 4 ? <button onClick={nextStep} type="button">다음 →</button> : <button disabled={saving || !canSave()} onClick={saveQuote} type="button">{saving ? "저장 중" : "저장"}</button>}</div>
    </div>
  );
}
