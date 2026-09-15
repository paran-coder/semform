"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteRecord, getAllRecords, putRecord, STORES } from "@/lib/storage/database";
import { createId } from "@/lib/ids";
import { formatWon, numberFromInput } from "@/lib/format";
import {
  CALCULATION_LABELS,
  PricingCalculationType,
  PricingItem,
  PricingPreset,
  ROUNDING_LABELS,
} from "@/types/pricing";

type LoadState = "loading" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

const CALCULATION_TYPES = Object.keys(CALCULATION_LABELS) as PricingCalculationType[];

function now() {
  return new Date().toISOString();
}

function blankItem(sortOrder = 0): PricingItem {
  return {
    id: createId("price-item"),
    name: "새 작업 항목",
    category: "AI 제작",
    calculationType: "fixed",
    unit: "건",
    basePrice: 0,
    unitPrice: 0,
    defaultQuantity: 1,
    percentage: 0,
    internalCost: 0,
    visibleOnQuote: true,
    sortOrder,
  };
}

function emptyPreset(): PricingPreset {
  const timestamp = now();
  return {
    id: createId("pricing"),
    name: "새 단가 프리셋",
    isDefault: false,
    minCharge: 0,
    rounding: "10000",
    items: [blankItem(0)],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function recommendedPreset(): PricingPreset {
  const timestamp = now();
  const item = (partial: Partial<PricingItem> & Pick<PricingItem, "name" | "sortOrder">): PricingItem => ({
    ...blankItem(partial.sortOrder),
    category: "AI 제작",
    ...partial,
    id: createId("price-item"),
  });

  return {
    id: createId("pricing"),
    name: "AI 영상 · 일반 고객",
    isDefault: true,
    minCharge: 500000,
    rounding: "10000",
    items: [
      item({ name: "기획 / 콘티", category: "기획", calculationType: "fixed", basePrice: 150000, internalCost: 0, sortOrder: 0 }),
      item({ name: "AI 이미지 생성", calculationType: "quantity", unit: "컷", unitPrice: 20000, defaultQuantity: 10, internalCost: 6000, sortOrder: 1 }),
      item({ name: "AI 영상 생성", calculationType: "quantity", unit: "컷", unitPrice: 30000, defaultQuantity: 10, internalCost: 10000, sortOrder: 2 }),
      item({ name: "영상 편집", category: "후반작업", calculationType: "fixed", basePrice: 250000, internalCost: 0, sortOrder: 3 }),
      item({ name: "AI 보이스", category: "오디오", calculationType: "fixed", basePrice: 50000, internalCost: 0, sortOrder: 4 }),
      item({ name: "4K 업스케일", category: "후반작업", calculationType: "fixed", basePrice: 80000, internalCost: 20000, sortOrder: 5 }),
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function clonePreset(preset: PricingPreset): PricingPreset {
  return {
    ...preset,
    items: preset.items.map((item) => ({ ...item })),
  };
}

function itemPricePreview(item: PricingItem) {
  switch (item.calculationType) {
    case "fixed":
      return formatWon(item.basePrice);
    case "percentage":
      return `${item.percentage}%`;
    case "base_plus_quantity":
      return `${formatWon(item.basePrice)} + ${formatWon(item.unitPrice)} / ${item.unit || "단위"}`;
    default:
      return `${formatWon(item.unitPrice)} / ${item.unit || CALCULATION_LABELS[item.calculationType]}`;
  }
}

export function PricingPresetsManager() {
  const [presets, setPresets] = useState<PricingPreset[]>([]);
  const [draft, setDraft] = useState<PricingPreset | null>(null);
  const [persistedSnapshot, setPersistedSnapshot] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("저장된 단가 프리셋을 불러오는 중입니다.");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const dirty = useMemo(() => Boolean(draft && JSON.stringify(draft) !== persistedSnapshot), [draft, persistedSnapshot]);

  async function reload(preferredId?: string) {
    try {
      const records = await getAllRecords<PricingPreset>(STORES.pricingPresets);
      const sorted = records.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.updatedAt.localeCompare(a.updatedAt));
      setPresets(sorted);
      setLoadState("ready");
      if (preferredId) {
        const selected = sorted.find((preset) => preset.id === preferredId);
        if (selected) {
          const next = clonePreset(selected);
          setDraft(next);
          setPersistedSnapshot(JSON.stringify(next));
        }
      }
      if (!preferredId) {
        if (sorted.length > 0) {
          const next = clonePreset(sorted[0]);
          setDraft(next);
          setPersistedSnapshot(JSON.stringify(next));
        } else {
          setDraft(null);
          setPersistedSnapshot("");
        }
      }
      setMessage(sorted.length ? "현재 브라우저에 저장된 프리셋입니다." : "아직 저장된 단가 프리셋이 없습니다.");
    } catch {
      setLoadState("error");
      setMessage("이 브라우저에서 로컬 저장소를 사용할 수 없습니다.");
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function choosePreset(preset: PricingPreset) {
    if (dirty && !window.confirm("저장하지 않은 변경사항이 있습니다. 다른 프리셋으로 이동할까요?")) return;
    const next = clonePreset(preset);
    setDraft(next);
    setPersistedSnapshot(JSON.stringify(next));
    setSaveState("idle");
    setDeleteConfirm(false);
    setMessage("프리셋을 불러왔습니다.");
  }

  function startNew(kind: "blank" | "recommended") {
    if (dirty && !window.confirm("저장하지 않은 변경사항이 있습니다. 새 프리셋을 만들까요?")) return;
    const next = kind === "recommended" ? recommendedPreset() : emptyPreset();
    setDraft(next);
    setPersistedSnapshot("");
    setSaveState("idle");
    setDeleteConfirm(false);
    setMessage(kind === "recommended" ? "추천 항목을 넣었습니다. 내 단가에 맞게 수정한 뒤 저장하세요." : "새 프리셋을 작성하고 있습니다.");
  }

  function markChanged() {
    setSaveState("idle");
    setDeleteConfirm(false);
    setMessage("변경사항이 저장되지 않았습니다.");
  }

  function updateDraft<K extends keyof PricingPreset>(field: K, value: PricingPreset[K]) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
    markChanged();
  }

  function updateItem(id: string, patch: Partial<PricingItem>) {
    setDraft((current) => {
      if (!current) return current;
      return { ...current, items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) };
    });
    markChanged();
  }

  function addItem() {
    setDraft((current) => current ? { ...current, items: [...current.items, blankItem(current.items.length)] } : current);
    markChanged();
  }

  function removeItem(id: string) {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        items: current.items.filter((item) => item.id !== id).map((item, index) => ({ ...item, sortOrder: index })),
      };
    });
    markChanged();
  }

  async function savePreset() {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      setSaveState("error");
      setMessage("프리셋 이름을 입력해 주세요.");
      return;
    }
    if (!draft.items.length) {
      setSaveState("error");
      setMessage("작업 항목을 하나 이상 추가해 주세요.");
      return;
    }
    if (draft.items.some((item) => !item.name.trim())) {
      setSaveState("error");
      setMessage("이름이 비어 있는 작업 항목이 있습니다.");
      return;
    }

    setSaveState("saving");
    setMessage("현재 브라우저에 저장하는 중입니다.");
    const timestamp = now();
    const next: PricingPreset = {
      ...draft,
      name,
      minCharge: Math.max(0, draft.minCharge),
      items: draft.items.map((item, index) => ({
        ...item,
        name: item.name.trim(),
        category: item.category.trim(),
        unit: item.unit.trim(),
        basePrice: Math.max(0, item.basePrice),
        unitPrice: Math.max(0, item.unitPrice),
        defaultQuantity: Math.max(0, item.defaultQuantity),
        percentage: Math.max(0, item.percentage),
        internalCost: Math.max(0, item.internalCost),
        sortOrder: index,
      })),
      updatedAt: timestamp,
      createdAt: draft.createdAt || timestamp,
    };

    try {
      if (next.isDefault) {
        for (const preset of presets) {
          if (preset.id !== next.id && preset.isDefault) {
            await putRecord(STORES.pricingPresets, { ...preset, isDefault: false, updatedAt: timestamp });
          }
        }
      }
      await putRecord(STORES.pricingPresets, next);
      setSaveState("saved");
      setMessage("단가 프리셋을 저장했습니다.");
      await reload(next.id);
    } catch {
      setSaveState("error");
      setMessage("프리셋을 저장하지 못했습니다.");
    }
  }

  async function removePreset() {
    if (!draft) return;
    const exists = presets.some((preset) => preset.id === draft.id);
    if (!exists) {
      setDraft(null);
      setPersistedSnapshot("");
      setDeleteConfirm(false);
      return;
    }
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setMessage("한 번 더 누르면 이 프리셋을 삭제합니다.");
      return;
    }
    try {
      await deleteRecord(STORES.pricingPresets, draft.id);
      setDraft(null);
      setPersistedSnapshot("");
      setDeleteConfirm(false);
      setSaveState("idle");
      await reload();
      setMessage("단가 프리셋을 삭제했습니다.");
    } catch {
      setSaveState("error");
      setMessage("프리셋을 삭제하지 못했습니다.");
    }
  }

  return (
    <div className="preset-workspace">
      <aside className="preset-sidebar" aria-label="단가 프리셋 목록">
        <div className="preset-sidebar__actions">
          <button className="sf-button sf-button--primary sf-button--md" onClick={() => startNew("blank")} type="button">+ 새 프리셋</button>
          <button className="sf-button sf-button--secondary sf-button--md" onClick={() => startNew("recommended")} type="button">추천 프리셋</button>
        </div>

        <div className="preset-sidebar__status">{loadState === "loading" ? "불러오는 중…" : `${presets.length}개의 프리셋`}</div>
        <div className="preset-list">
          {presets.map((preset) => (
            <button
              className={`preset-list-item${draft?.id === preset.id && persistedSnapshot ? " is-active" : ""}`}
              key={preset.id}
              onClick={() => choosePreset(preset)}
              type="button"
            >
              <span className="preset-list-item__title">
                {preset.isDefault ? <i aria-label="기본 프리셋" /> : null}
                {preset.name}
              </span>
              <span className="preset-list-item__meta">항목 {preset.items.length}개 · 최소 {formatWon(preset.minCharge)}</span>
            </button>
          ))}
          {loadState === "ready" && presets.length === 0 ? (
            <div className="preset-list-empty">저장된 프리셋이 없습니다.<br />추천 프리셋으로 빠르게 시작할 수 있습니다.</div>
          ) : null}
        </div>
      </aside>

      <section className="preset-editor">
        {!draft ? (
          <div className="preset-editor-empty">
            <p className="eyebrow">단가 프리셋</p>
            <h2>내 작업 단가를 한 번 저장해 두세요.</h2>
            <p>견적 작성 시 프리셋을 불러오고, 해당 견적에서만 단가를 바꿀 수 있게 됩니다.</p>
            <div className="preset-editor-empty__actions">
              <button className="sf-button sf-button--primary sf-button--lg" onClick={() => startNew("recommended")} type="button">추천 프리셋으로 시작</button>
              <button className="sf-button sf-button--secondary sf-button--lg" onClick={() => startNew("blank")} type="button">빈 프리셋 만들기</button>
            </div>
          </div>
        ) : (
          <>
            <div className="preset-editor__header">
              <div>
                <p className="eyebrow">{persistedSnapshot ? "프리셋 편집" : "새 프리셋"}</p>
                <h2>{draft.name || "이름 없는 프리셋"}</h2>
              </div>
              <label className="check-control">
                <input checked={draft.isDefault} onChange={(event) => updateDraft("isDefault", event.target.checked)} type="checkbox" />
                <span>기본 프리셋</span>
              </label>
            </div>

            <div className="preset-meta-grid">
              <label className="field field--span-2">
                <span className="field__label">프리셋 이름</span>
                <input maxLength={60} onChange={(event) => updateDraft("name", event.target.value)} value={draft.name} />
              </label>
              <label className="field">
                <span className="field__label">최소 작업비</span>
                <div className="money-field"><span>₩</span><input inputMode="numeric" min="0" onChange={(event) => updateDraft("minCharge", numberFromInput(event.target.value))} type="number" value={draft.minCharge} /></div>
              </label>
              <label className="field">
                <span className="field__label">금액 라운딩</span>
                <select onChange={(event) => updateDraft("rounding", event.target.value as PricingPreset["rounding"])} value={draft.rounding}>
                  {Object.entries(ROUNDING_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>

            <div className="preset-section-heading">
              <div>
                <p className="eyebrow">작업 항목</p>
                <h3>{draft.items.length}개 항목</h3>
              </div>
              <button className="sf-button sf-button--secondary sf-button--sm" onClick={addItem} type="button">+ 항목 추가</button>
            </div>

            <div className="pricing-item-list">
              {draft.items.map((item, index) => (
                <article className="pricing-item-editor" key={item.id}>
                  <div className="pricing-item-editor__top">
                    <div className="pricing-item-editor__index">{String(index + 1).padStart(2, "0")}</div>
                    <div className="pricing-item-editor__summary">
                      <strong>{item.name || "이름 없는 항목"}</strong>
                      <span>{CALCULATION_LABELS[item.calculationType]} · {itemPricePreview(item)}</span>
                    </div>
                    <button className="inline-danger" onClick={() => removeItem(item.id)} type="button">삭제</button>
                  </div>

                  <div className="pricing-item-editor__grid">
                    <label className="field field--wide">
                      <span className="field__label">항목명</span>
                      <input maxLength={80} onChange={(event) => updateItem(item.id, { name: event.target.value })} value={item.name} />
                    </label>
                    <label className="field">
                      <span className="field__label">카테고리</span>
                      <input maxLength={40} onChange={(event) => updateItem(item.id, { category: event.target.value })} value={item.category} />
                    </label>
                    <label className="field">
                      <span className="field__label">계산 방식</span>
                      <select onChange={(event) => updateItem(item.id, { calculationType: event.target.value as PricingCalculationType })} value={item.calculationType}>
                        {CALCULATION_TYPES.map((type) => <option key={type} value={type}>{CALCULATION_LABELS[type]}</option>)}
                      </select>
                    </label>

                    {item.calculationType === "fixed" || item.calculationType === "base_plus_quantity" ? (
                      <label className="field">
                        <span className="field__label">{item.calculationType === "fixed" ? "고정금액" : "기본금액"}</span>
                        <div className="money-field"><span>₩</span><input inputMode="numeric" min="0" onChange={(event) => updateItem(item.id, { basePrice: numberFromInput(event.target.value) })} type="number" value={item.basePrice} /></div>
                      </label>
                    ) : null}

                    {!["fixed", "percentage"].includes(item.calculationType) ? (
                      <>
                        <label className="field">
                          <span className="field__label">단위</span>
                          <input maxLength={20} onChange={(event) => updateItem(item.id, { unit: event.target.value })} value={item.unit} />
                        </label>
                        <label className="field">
                          <span className="field__label">단가</span>
                          <div className="money-field"><span>₩</span><input inputMode="numeric" min="0" onChange={(event) => updateItem(item.id, { unitPrice: numberFromInput(event.target.value) })} type="number" value={item.unitPrice} /></div>
                        </label>
                        <label className="field">
                          <span className="field__label">기본 수량</span>
                          <input inputMode="decimal" min="0" onChange={(event) => updateItem(item.id, { defaultQuantity: numberFromInput(event.target.value) })} type="number" value={item.defaultQuantity} />
                        </label>
                      </>
                    ) : null}

                    {item.calculationType === "percentage" ? (
                      <label className="field">
                        <span className="field__label">비율</span>
                        <div className="suffix-field"><input inputMode="decimal" min="0" onChange={(event) => updateItem(item.id, { percentage: numberFromInput(event.target.value) })} type="number" value={item.percentage} /><span>%</span></div>
                      </label>
                    ) : null}

                    <label className="field">
                      <span className="field__label">내부 원가</span>
                      <div className="money-field"><span>₩</span><input inputMode="numeric" min="0" onChange={(event) => updateItem(item.id, { internalCost: numberFromInput(event.target.value) })} type="number" value={item.internalCost} /></div>
                    </label>
                    <label className="check-control check-control--field">
                      <input checked={item.visibleOnQuote} onChange={(event) => updateItem(item.id, { visibleOnQuote: event.target.checked })} type="checkbox" />
                      <span>견적서에 표시</span>
                    </label>
                  </div>
                </article>
              ))}
            </div>

            <div className="preset-savebar">
              <div className={`save-status save-status--${saveState}`} role="status"><span className="save-status__dot" /> <span>{dirty ? message : saveState === "saved" ? message : "저장된 상태입니다."}</span></div>
              <div className="preset-savebar__actions">
                <button className={`sf-button sf-button--secondary sf-button--md${deleteConfirm ? " is-danger-confirm" : ""}`} onClick={removePreset} type="button">{deleteConfirm ? "삭제 확인" : "삭제"}</button>
                <button className="sf-button sf-button--primary sf-button--md" disabled={saveState === "saving" || !dirty} onClick={savePreset} type="button">{saveState === "saving" ? "저장 중" : "프리셋 저장"}</button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
