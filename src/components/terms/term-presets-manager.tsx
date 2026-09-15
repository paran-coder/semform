"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, SlidersIcon } from "@/components/ui/icons";
import { deleteRecord, getAllRecords, putRecord, STORES } from "@/lib/storage/database";
import { clearLocalDraft, getLocalDraft, saveLocalDraft } from "@/lib/storage/drafts";
import { createId } from "@/lib/ids";
import { formatWon, numberFromInput } from "@/lib/format";
import { TermPreset } from "@/types/terms";

type LoadState = "loading" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

const DRAFT_KEY = "term-preset-draft";
type PresetDraftState = { draft: TermPreset; persistedSnapshot: string };

function now() { return new Date().toISOString(); }

function emptyPreset(): TermPreset {
  const timestamp = now();
  return {
    id: createId("terms"), name: "새 조건 프리셋", isDefault: false, depositPercent: 50, balancePercent: 50,
    revisionCount: 2, extraRevisionFee: 0, validDays: 14, usageTerms: "", copyrightTerms: "", sourceFileTerms: "",
    portfolioAllowed: true, cancellationTerms: "", notes: "", createdAt: timestamp, updatedAt: timestamp,
  };
}

function recommendedPreset(): TermPreset {
  const timestamp = now();
  return {
    id: createId("terms"), name: "AI 영상 · 기본 조건", isDefault: true, depositPercent: 50, balancePercent: 50,
    revisionCount: 2, extraRevisionFee: 80000, validDays: 14,
    usageTerms: "브랜드 공식 SNS, 홈페이지 및 디지털 광고 채널에서의 상업적 이용을 포함합니다.",
    copyrightTerms: "최종 납품본의 이용 범위는 본 견적 조건을 따르며, 제3자 재판매 및 권리 양도는 별도 협의합니다.",
    sourceFileTerms: "생성 원본, 프롬프트, 편집 프로젝트 파일은 기본 납품 범위에서 제외하며 필요 시 별도 견적합니다.",
    portfolioAllowed: true,
    cancellationTerms: "작업 착수 후 취소 시 진행된 작업 범위와 실제 발생 비용을 기준으로 정산합니다.", notes: "",
    createdAt: timestamp, updatedAt: timestamp,
  };
}

function clonePreset(preset: TermPreset) { return { ...preset }; }

export function TermPresetsManager() {
  const [presets, setPresets] = useState<TermPreset[]>([]);
  const [draft, setDraft] = useState<TermPreset | null>(null);
  const [persistedSnapshot, setPersistedSnapshot] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("저장된 조건 프리셋을 불러오는 중입니다.");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const latestDraftRef = useRef<PresetDraftState | null>(null);
  const latestDirtyRef = useRef(false);

  const dirty = useMemo(() => Boolean(draft && JSON.stringify(draft) !== persistedSnapshot), [draft, persistedSnapshot]);
  const paymentTotal = (draft?.depositPercent ?? 0) + (draft?.balancePercent ?? 0);
  const defaultPreset = presets.find((preset) => preset.isDefault);

  async function reload(preferredId?: string, restoreDraft = false) {
    try {
      const records = await getAllRecords<TermPreset>(STORES.termPresets);
      const sorted = records.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.updatedAt.localeCompare(a.updatedAt));
      setPresets(sorted); setLoadState("ready");
      if (restoreDraft && !preferredId) {
        const local = await getLocalDraft<PresetDraftState>(DRAFT_KEY);
        if (local?.draft) {
          setDraft(clonePreset(local.draft));
          setPersistedSnapshot(local.persistedSnapshot);
          setMessage("작성 중이던 프리셋을 이어서 불러왔습니다.");
          return;
        }
      }
      const selected = preferredId ? sorted.find((preset) => preset.id === preferredId) : sorted[0];
      if (selected) { const next = clonePreset(selected); setDraft(next); setPersistedSnapshot(JSON.stringify(next)); }
      else { setDraft(null); setPersistedSnapshot(""); }
      setMessage(sorted.length ? "현재 브라우저에 저장된 조건 프리셋입니다." : "아직 저장된 조건 프리셋이 없습니다.");
    } catch { setLoadState("error"); setMessage("이 브라우저에서 로컬 저장소를 사용할 수 없습니다."); }
  }

  useEffect(() => { void reload(undefined, true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => {
    latestDirtyRef.current = dirty;
    latestDraftRef.current = draft ? { draft: clonePreset(draft), persistedSnapshot } : null;
  }, [draft, dirty, persistedSnapshot]);
  useEffect(() => {
    if (loadState !== "ready" || !draft || !dirty) return;
    const timer = window.setTimeout(() => {
      void saveLocalDraft<PresetDraftState>(DRAFT_KEY, { draft: clonePreset(draft), persistedSnapshot })
        .then(() => setMessage("작성 중인 내용이 임시 저장되었습니다."))
        .catch(() => setMessage("임시 저장에 실패했습니다."));
    }, 150);
    return () => window.clearTimeout(timer);
  }, [draft, dirty, loadState, persistedSnapshot]);
  useEffect(() => () => {
    if (latestDirtyRef.current && latestDraftRef.current) void saveLocalDraft<PresetDraftState>(DRAFT_KEY, latestDraftRef.current);
  }, []);

  function choosePreset(preset: TermPreset) {
    if (dirty && !window.confirm("저장하지 않은 변경사항이 있습니다. 다른 프리셋으로 이동할까요?")) return;
    const next = clonePreset(preset); void clearLocalDraft(DRAFT_KEY); setDraft(next); setPersistedSnapshot(JSON.stringify(next)); setSaveState("idle"); setDeleteConfirm(false); setMessage("프리셋을 불러왔습니다.");
  }

  function startNew(kind: "blank" | "recommended") {
    if (dirty && !window.confirm("저장하지 않은 변경사항이 있습니다. 새 프리셋을 만들까요?")) return;
    const next = kind === "recommended" ? recommendedPreset() : emptyPreset();
    setDraft(next); setPersistedSnapshot(""); setSaveState("idle"); setDeleteConfirm(false);
    void saveLocalDraft<PresetDraftState>(DRAFT_KEY, { draft: clonePreset(next), persistedSnapshot: "" });
    setMessage(kind === "recommended" ? "추천 조건을 넣었습니다. 실제 작업 방식에 맞게 수정한 뒤 저장하세요." : "새 조건 프리셋을 작성하고 있습니다.");
  }

  function updateDraft<K extends keyof TermPreset>(field: K, value: TermPreset[K]) {
    setDraft((current) => current ? { ...current, [field]: value } : current); setSaveState("idle"); setDeleteConfirm(false); setMessage("변경사항이 저장되지 않았습니다.");
  }

  async function savePreset() {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) { setSaveState("error"); setMessage("프리셋 이름을 입력해 주세요."); return; }
    if (draft.depositPercent < 0 || draft.depositPercent > 100 || draft.balancePercent < 0 || draft.balancePercent > 100) { setSaveState("error"); setMessage("계약금과 잔금은 각각 0~100% 범위로 입력해 주세요."); return; }
    if (paymentTotal !== 100) { setSaveState("error"); setMessage("계약금과 잔금의 합계는 100%여야 합니다."); return; }

    setSaveState("saving"); setMessage("현재 브라우저에 저장하는 중입니다.");
    const timestamp = now();
    const next: TermPreset = {
      ...draft, name, depositPercent: Math.max(0, draft.depositPercent), balancePercent: Math.max(0, draft.balancePercent),
      revisionCount: Math.max(0, Math.round(draft.revisionCount)), extraRevisionFee: Math.max(0, draft.extraRevisionFee), validDays: Math.max(1, Math.round(draft.validDays)),
      usageTerms: draft.usageTerms.trim(), copyrightTerms: draft.copyrightTerms.trim(), sourceFileTerms: draft.sourceFileTerms.trim(),
      cancellationTerms: draft.cancellationTerms.trim(), notes: draft.notes.trim(), createdAt: draft.createdAt || timestamp, updatedAt: timestamp,
    };
    try {
      if (next.isDefault) for (const preset of presets) if (preset.id !== next.id && preset.isDefault) await putRecord(STORES.termPresets, { ...preset, isDefault: false, updatedAt: timestamp });
      await putRecord(STORES.termPresets, next); await clearLocalDraft(DRAFT_KEY); setSaveState("saved"); setMessage("조건 프리셋을 저장했습니다."); await reload(next.id, false);
    } catch { setSaveState("error"); setMessage("프리셋을 저장하지 못했습니다."); }
  }

  async function removePreset() {
    if (!draft) return;
    const exists = presets.some((preset) => preset.id === draft.id);
    if (!exists) { await clearLocalDraft(DRAFT_KEY); setDraft(null); setPersistedSnapshot(""); setDeleteConfirm(false); return; }
    if (!deleteConfirm) { setDeleteConfirm(true); setMessage("한 번 더 누르면 이 프리셋을 삭제합니다."); return; }
    try { await deleteRecord(STORES.termPresets, draft.id); await clearLocalDraft(DRAFT_KEY); setDraft(null); setPersistedSnapshot(""); setDeleteConfirm(false); setSaveState("idle"); await reload(undefined, false); setMessage("조건 프리셋을 삭제했습니다."); }
    catch { setSaveState("error"); setMessage("프리셋을 삭제하지 못했습니다."); }
  }

  const showWorkspace = Boolean(draft || presets.length);

  return (
    <div className="preset-manager">
      <div className="preset-toolbar">
        <div className="preset-toolbar__stats">
          <span><strong>{loadState === "loading" ? "…" : presets.length}</strong> 저장된 프리셋</span><i /><span>기본 <b>{defaultPreset?.name || "미설정"}</b></span>
        </div>
        <div className="preset-toolbar__actions">
          <button className="sf-button sf-button--secondary sf-button--md" onClick={() => startNew("recommended")} type="button">추천으로 시작</button>
          <button className="sf-button sf-button--primary sf-button--md" onClick={() => startNew("blank")} type="button"><PlusIcon size={17} /> 새 프리셋</button>
        </div>
      </div>

      {!showWorkspace && loadState === "ready" ? (
        <section className="preset-onboarding">
          <div className="preset-onboarding__icon"><SlidersIcon size={24} /></div>
          <p className="eyebrow">빠른 시작</p><h2>반복해서 쓰는 조건을 저장하세요.</h2>
          <p>결제 비율, 수정 횟수, 권리와 원본 제공 조건을 견적마다 다시 작성하지 않아도 됩니다.</p>
          <div className="preset-starter-grid">
            <button className="preset-starter-card preset-starter-card--recommended" onClick={() => startNew("recommended")} type="button"><span className="preset-starter-card__badge">추천</span><strong>AI 영상 · 기본 조건</strong><span>계약금 50%, 수정 2회, 유효기간 14일과 기본 권리 문구</span><em>추천 조건으로 시작 →</em></button>
            <button className="preset-starter-card" onClick={() => startNew("blank")} type="button"><span className="preset-starter-card__badge">직접 설정</span><strong>빈 조건 프리셋</strong><span>필요한 문구와 비율을 처음부터 내 거래 방식에 맞게 구성합니다.</span><em>빈 프리셋 만들기 →</em></button>
          </div>
        </section>
      ) : (
        <div className={`preset-workspace preset-workspace--terms${presets.length === 0 ? " preset-workspace--single" : ""}`}>
          {presets.length > 0 ? (
            <aside className="preset-sidebar" aria-label="조건 프리셋 목록">
              <div className="preset-sidebar__title"><span>프리셋</span><small>{presets.length}</small></div>
              <div className="preset-list">
                {presets.map((preset) => (
                  <button className={`preset-list-item${draft?.id === preset.id && persistedSnapshot ? " is-active" : ""}`} key={preset.id} onClick={() => choosePreset(preset)} type="button">
                    <span className="preset-list-item__title">{preset.isDefault ? <i aria-label="기본 프리셋" /> : null}{preset.name}</span>
                    <span className="preset-list-item__meta">수정 {preset.revisionCount}회 · 유효 {preset.validDays}일</span>
                  </button>
                ))}
              </div>
            </aside>
          ) : null}

          <section className="preset-editor">
            {draft ? (
              <>
                <div className="preset-editor__header">
                  <div><p className="eyebrow">{persistedSnapshot ? "프리셋 편집" : "새 프리셋"}</p><h2>{draft.name || "이름 없는 프리셋"}</h2><span>견적에 불러온 조건은 해당 견적에서 별도로 수정할 수 있습니다.</span></div>
                  <label className="check-control"><input checked={draft.isDefault} onChange={(event) => updateDraft("isDefault", event.target.checked)} type="checkbox" /><span>기본 프리셋</span></label>
                </div>

                <div className="terms-form">
                  <section className="editor-section terms-section-new">
                    <div className="editor-section__heading"><span>01</span><div><h3>기본</h3><p>프리셋 이름과 견적 유효기간을 설정합니다.</p></div></div>
                    <div className="form-grid form-grid--2"><label className="field field--span-2"><span className="field__label">프리셋 이름</span><input maxLength={60} onChange={(event) => updateDraft("name", event.target.value)} value={draft.name} /></label><label className="field"><span className="field__label">견적 유효기간</span><div className="suffix-field"><input inputMode="numeric" min="1" onChange={(event) => updateDraft("validDays", numberFromInput(event.target.value))} type="number" value={draft.validDays} /><span>일</span></div></label></div>
                  </section>

                  <section className="editor-section terms-section-new">
                    <div className="editor-section__heading"><span>02</span><div><h3>결제</h3><p>계약금과 잔금의 합계는 100%로 맞춥니다.</p></div></div>
                    <div><div className="form-grid form-grid--2"><label className="field"><span className="field__label">계약금</span><div className="suffix-field"><input inputMode="numeric" min="0" max="100" onChange={(event) => updateDraft("depositPercent", numberFromInput(event.target.value))} type="number" value={draft.depositPercent} /><span>%</span></div></label><label className="field"><span className="field__label">잔금</span><div className="suffix-field"><input inputMode="numeric" min="0" max="100" onChange={(event) => updateDraft("balancePercent", numberFromInput(event.target.value))} type="number" value={draft.balancePercent} /><span>%</span></div></label></div><div className={`payment-total${paymentTotal === 100 ? " is-valid" : " is-invalid"}`}><span>합계</span><strong>{paymentTotal}%</strong><em>{paymentTotal === 100 ? "정상" : "100%로 맞춰 주세요"}</em></div></div>
                  </section>

                  <section className="editor-section terms-section-new">
                    <div className="editor-section__heading"><span>03</span><div><h3>수정</h3><p>기본 수정 횟수와 추가 수정 비용을 정합니다.</p></div></div>
                    <div><div className="form-grid form-grid--2"><label className="field"><span className="field__label">기본 수정</span><div className="suffix-field"><input inputMode="numeric" min="0" onChange={(event) => updateDraft("revisionCount", numberFromInput(event.target.value))} type="number" value={draft.revisionCount} /><span>회</span></div></label><label className="field"><span className="field__label">추가 수정 1회</span><div className="money-field"><span>₩</span><input inputMode="numeric" min="0" onChange={(event) => updateDraft("extraRevisionFee", numberFromInput(event.target.value))} type="number" value={draft.extraRevisionFee} /></div></label></div><p className="field-hint">기본 {draft.revisionCount}회 · 추가 수정 {formatWon(draft.extraRevisionFee)} / 회</p></div>
                  </section>

                  <section className="editor-section terms-section-new">
                    <div className="editor-section__heading"><span>04</span><div><h3>권리와 납품</h3><p>고객에게 보이는 견적서의 TERMS 영역에 들어갈 문구입니다.</p></div></div>
                    <div className="form-grid"><label className="field"><span className="field__label">상업적 이용 조건</span><textarea rows={4} onChange={(event) => updateDraft("usageTerms", event.target.value)} placeholder="예: 브랜드 공식 SNS 및 디지털 광고 사용 포함" value={draft.usageTerms} /></label><label className="field"><span className="field__label">저작권 / 권리 조건</span><textarea rows={4} onChange={(event) => updateDraft("copyrightTerms", event.target.value)} value={draft.copyrightTerms} /></label><label className="field"><span className="field__label">원본 / 프로젝트 파일</span><textarea rows={4} onChange={(event) => updateDraft("sourceFileTerms", event.target.value)} value={draft.sourceFileTerms} /></label><label className="check-control check-control--line"><input checked={draft.portfolioAllowed} onChange={(event) => updateDraft("portfolioAllowed", event.target.checked)} type="checkbox" /><span>완성본을 포트폴리오에 공개할 수 있음</span></label></div>
                  </section>

                  <section className="editor-section terms-section-new">
                    <div className="editor-section__heading"><span>05</span><div><h3>취소 및 기타</h3><p>필요할 때만 사용하고 비워두어도 됩니다.</p></div></div>
                    <div className="form-grid"><label className="field"><span className="field__label">취소 / 환불 조건</span><textarea rows={4} onChange={(event) => updateDraft("cancellationTerms", event.target.value)} value={draft.cancellationTerms} /></label><label className="field"><span className="field__label">내부 메모</span><textarea rows={3} onChange={(event) => updateDraft("notes", event.target.value)} placeholder="고객에게 표시되지 않는 메모" value={draft.notes} /></label></div>
                  </section>
                </div>

                <div className="preset-savebar"><div className={`save-status save-status--${saveState}`} role="status"><span className="save-status__dot" /><span>{dirty ? message : saveState === "saved" ? message : "저장된 상태입니다."}</span></div><div className="preset-savebar__actions"><button className={`sf-button sf-button--secondary sf-button--md${deleteConfirm ? " is-danger-confirm" : ""}`} onClick={removePreset} type="button">{deleteConfirm ? "삭제 확인" : "삭제"}</button><button className="sf-button sf-button--primary sf-button--md" disabled={saveState === "saving" || !dirty || paymentTotal !== 100} onClick={savePreset} type="button">{saveState === "saving" ? "저장 중" : "프리셋 저장"}</button></div></div>
              </>
            ) : null}
          </section>
        </div>
      )}
      {loadState === "error" ? <p className="manager-error">{message}</p> : null}
    </div>
  );
}
