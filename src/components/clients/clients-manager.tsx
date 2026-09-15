"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRightIcon, BuildingIcon, PlusIcon, SearchIcon } from "@/components/ui/icons";
import { createId } from "@/lib/ids";
import { formatWon } from "@/lib/format";
import { deleteRecord, getAllRecords, putRecord, STORES } from "@/lib/storage/database";
import type { Client, ClientQuoteSummary } from "@/types/client";

type SaveState = "idle" | "saving" | "saved" | "error";

type LoadState = "loading" | "ready" | "error";

function now() {
  return new Date().toISOString();
}

function emptyClient(): Client {
  const timestamp = now();
  return {
    id: createId("client"),
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    businessNumber: "",
    address: "",
    website: "",
    notes: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function cloneClient(client: Client) {
  return { ...client };
}

function dateLabel(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(date).replace(/\. /g, ".").replace(".", "");
}

export function ClientsManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<ClientQuoteSummary[]>([]);
  const [draft, setDraft] = useState<Client | null>(null);
  const [persistedSnapshot, setPersistedSnapshot] = useState("");
  const [query, setQuery] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("고객 정보를 불러오는 중입니다.");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const dirty = useMemo(() => Boolean(draft && JSON.stringify(draft) !== persistedSnapshot), [draft, persistedSnapshot]);

  const filteredClients = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ko-KR");
    if (!keyword) return clients;
    return clients.filter((client) => [client.companyName, client.contactName, client.phone, client.email]
      .some((value) => value.toLocaleLowerCase("ko-KR").includes(keyword)));
  }, [clients, query]);

  const clientQuotes = useMemo(() => draft ? quotes
    .filter((quote) => quote.clientId === draft.id)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")) : [], [draft, quotes]);

  async function reload(preferredId?: string) {
    try {
      const [clientRecords, quoteRecords] = await Promise.all([
        getAllRecords<Client>(STORES.clients),
        getAllRecords<ClientQuoteSummary>(STORES.quotes),
      ]);
      const sorted = clientRecords.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setClients(sorted);
      setQuotes(quoteRecords);
      setLoadState("ready");

      const selected = preferredId ? sorted.find((client) => client.id === preferredId) : sorted[0];
      if (selected) {
        const next = cloneClient(selected);
        setDraft(next);
        setPersistedSnapshot(JSON.stringify(next));
      } else {
        setDraft(null);
        setPersistedSnapshot("");
      }
      setMessage(sorted.length ? "현재 브라우저에 저장된 고객입니다." : "아직 저장된 고객이 없습니다.");
    } catch {
      setLoadState("error");
      setMessage("이 브라우저에서 고객 데이터를 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function chooseClient(client: Client) {
    if (dirty && !window.confirm("저장하지 않은 변경사항이 있습니다. 다른 고객으로 이동할까요?")) return;
    const next = cloneClient(client);
    setDraft(next);
    setPersistedSnapshot(JSON.stringify(next));
    setSaveState("idle");
    setDeleteConfirm(false);
    setMessage("고객 정보를 불러왔습니다.");
  }

  function startNew() {
    if (dirty && !window.confirm("저장하지 않은 변경사항이 있습니다. 새 고객을 만들까요?")) return;
    const next = emptyClient();
    setDraft(next);
    setPersistedSnapshot("");
    setSaveState("idle");
    setDeleteConfirm(false);
    setMessage("새 고객 정보를 입력하고 있습니다.");
  }

  function updateDraft<K extends keyof Client>(field: K, value: Client[K]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
    setSaveState("idle");
    setDeleteConfirm(false);
    setMessage("변경사항이 저장되지 않았습니다.");
  }

  async function saveClient() {
    if (!draft) return;
    const companyName = draft.companyName.trim();
    if (!companyName) {
      setSaveState("error");
      setMessage("고객명 또는 회사명을 입력해 주세요.");
      return;
    }

    const timestamp = now();
    const next: Client = {
      ...draft,
      companyName,
      contactName: draft.contactName.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      businessNumber: draft.businessNumber.trim(),
      address: draft.address.trim(),
      website: draft.website.trim(),
      notes: draft.notes.trim(),
      createdAt: draft.createdAt || timestamp,
      updatedAt: timestamp,
    };

    setSaveState("saving");
    setMessage("현재 브라우저에 저장하는 중입니다.");
    try {
      await putRecord(STORES.clients, next);
      setSaveState("saved");
      setMessage("고객 정보를 저장했습니다.");
      await reload(next.id);
    } catch {
      setSaveState("error");
      setMessage("고객 정보를 저장하지 못했습니다.");
    }
  }

  async function removeClient() {
    if (!draft) return;
    const exists = clients.some((client) => client.id === draft.id);
    if (!exists) {
      setDraft(null);
      setPersistedSnapshot("");
      return;
    }
    if (clientQuotes.length > 0) {
      setSaveState("error");
      setMessage("연결된 견적이 있는 고객은 삭제할 수 없습니다. 견적의 고객을 먼저 변경해 주세요.");
      return;
    }
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setMessage("한 번 더 누르면 이 고객을 삭제합니다.");
      return;
    }
    try {
      await deleteRecord(STORES.clients, draft.id);
      setDeleteConfirm(false);
      setSaveState("idle");
      await reload();
      setMessage("고객을 삭제했습니다.");
    } catch {
      setSaveState("error");
      setMessage("고객을 삭제하지 못했습니다.");
    }
  }

  const showWorkspace = Boolean(draft || clients.length);

  return (
    <div className="entity-manager client-manager">
      <div className="entity-toolbar">
        <div className="entity-toolbar__summary">
          <span className="entity-toolbar__count">{loadState === "loading" ? "…" : clients.length}</span>
          <span>저장된 고객</span>
        </div>
        <button className="sf-button sf-button--primary sf-button--md" onClick={startNew} type="button">
          <PlusIcon size={17} /> 새 고객
        </button>
      </div>

      {!showWorkspace && loadState === "ready" ? (
        <section className="entity-onboarding">
          <div className="entity-onboarding__icon"><BuildingIcon size={24} /></div>
          <p className="eyebrow">고객 관리</p>
          <h2>자주 거래하는 고객을 저장해 두세요.</h2>
          <p>연락처와 사업자 정보를 한 번 저장하면 견적을 만들 때 고객 정보를 다시 입력하지 않아도 됩니다.</p>
          <button className="sf-button sf-button--primary sf-button--lg" onClick={startNew} type="button"><PlusIcon size={18} /> 첫 고객 추가</button>
        </section>
      ) : (
        <div className="entity-workspace">
          <aside className="entity-list-panel" aria-label="고객 목록">
            <div className="entity-search">
              <SearchIcon size={16} />
              <input aria-label="고객 검색" onChange={(event) => setQuery(event.target.value)} placeholder="고객 검색" value={query} />
            </div>
            <div className="entity-list-meta">
              <span>{query ? `검색 ${filteredClients.length}건` : `${clients.length}명의 고객`}</span>
            </div>
            <div className="entity-list">
              {filteredClients.map((client) => {
                const count = quotes.filter((quote) => quote.clientId === client.id).length;
                return (
                  <button className={`entity-list-item${draft?.id === client.id && persistedSnapshot ? " is-active" : ""}`} key={client.id} onClick={() => chooseClient(client)} type="button">
                    <span className="entity-list-item__avatar">{client.companyName.trim().slice(0, 1) || "?"}</span>
                    <span className="entity-list-item__copy">
                      <strong>{client.companyName}</strong>
                      <span>{client.contactName || client.email || client.phone || "연락처 미입력"}</span>
                    </span>
                    <span className="entity-list-item__count">{count ? `${count}건` : ""}</span>
                  </button>
                );
              })}
              {filteredClients.length === 0 ? <div className="entity-list-empty">{query ? "검색 결과가 없습니다." : "저장된 고객이 없습니다."}</div> : null}
            </div>
          </aside>

          <section className="entity-editor">
            {!draft ? null : (
              <>
                <header className="entity-editor__header">
                  <div>
                    <p className="eyebrow">{persistedSnapshot ? "고객 상세" : "새 고객"}</p>
                    <h2>{draft.companyName || "고객명을 입력하세요"}</h2>
                    <span>{draft.contactName ? `${draft.contactName} 담당` : "담당자 미입력"}</span>
                  </div>
                  {persistedSnapshot ? <Link className="text-action text-action--link" href={`/quotes/new?client=${draft.id}`}>이 고객으로 견적 만들기 <ArrowRightIcon size={15} /></Link> : null}
                </header>

                <div className="entity-editor__body">
                  <section className="editor-section">
                    <div className="editor-section__heading"><span>01</span><div><h3>기본 정보</h3><p>견적서에 표시하거나 연락에 사용하는 고객 정보입니다.</p></div></div>
                    <div className="form-grid form-grid--2">
                      <label className="field field--span-2"><span className="field__label">고객명 / 회사명 *</span><input maxLength={80} onChange={(event) => updateDraft("companyName", event.target.value)} placeholder="예: ABC Cosmetic" value={draft.companyName} /></label>
                      <label className="field"><span className="field__label">담당자</span><input maxLength={50} onChange={(event) => updateDraft("contactName", event.target.value)} placeholder="예: 김OO" value={draft.contactName} /></label>
                      <label className="field"><span className="field__label">전화번호</span><input inputMode="tel" maxLength={30} onChange={(event) => updateDraft("phone", event.target.value)} placeholder="010-0000-0000" value={draft.phone} /></label>
                      <label className="field"><span className="field__label">이메일</span><input inputMode="email" maxLength={100} onChange={(event) => updateDraft("email", event.target.value)} placeholder="client@example.com" value={draft.email} /></label>
                      <label className="field"><span className="field__label">홈페이지</span><input maxLength={180} onChange={(event) => updateDraft("website", event.target.value)} placeholder="https://" value={draft.website} /></label>
                    </div>
                  </section>

                  <section className="editor-section">
                    <div className="editor-section__heading"><span>02</span><div><h3>사업자 정보</h3><p>필요한 고객에게만 입력하면 됩니다.</p></div></div>
                    <div className="form-grid form-grid--2">
                      <label className="field"><span className="field__label">사업자등록번호</span><input maxLength={30} onChange={(event) => updateDraft("businessNumber", event.target.value)} value={draft.businessNumber} /></label>
                      <label className="field field--span-2"><span className="field__label">주소</span><input maxLength={180} onChange={(event) => updateDraft("address", event.target.value)} value={draft.address} /></label>
                    </div>
                  </section>

                  <section className="editor-section">
                    <div className="editor-section__heading"><span>03</span><div><h3>내부 메모</h3><p>고객에게 노출되지 않는 개인 메모입니다.</p></div></div>
                    <label className="field"><span className="field__label">메모</span><textarea onChange={(event) => updateDraft("notes", event.target.value)} placeholder="예: 수정 요청이 많은 고객, 담당자 선호 연락 시간 등" rows={4} value={draft.notes} /></label>
                  </section>

                  <section className="editor-section editor-section--quotes">
                    <div className="editor-section__heading"><span>04</span><div><h3>과거 견적</h3><p>이 고객과 연결된 견적이 자동으로 모입니다.</p></div></div>
                    <div className="client-quote-history">
                      {clientQuotes.length ? clientQuotes.map((quote) => (
                        <Link className="client-quote-row" href={`/quotes/${quote.id}`} key={quote.id}>
                          <span><strong>{quote.projectName || "프로젝트명 없음"}</strong><small>{quote.quoteNumber || "견적"} · {dateLabel(quote.updatedAt)}</small></span>
                          <b>{formatWon(quote.total ?? 0)}</b>
                          <ArrowRightIcon size={15} />
                        </Link>
                      )) : (
                        <div className="client-quote-empty">아직 연결된 견적이 없습니다.{persistedSnapshot ? <Link href={`/quotes/new?client=${draft.id}`}>첫 견적 만들기 →</Link> : null}</div>
                      )}
                    </div>
                  </section>
                </div>

                <div className="preset-savebar entity-savebar">
                  <div className={`save-status save-status--${saveState}`} role="status"><span className="save-status__dot" /><span>{dirty ? message : saveState === "saved" ? message : persistedSnapshot ? "저장된 상태입니다." : message}</span></div>
                  <div className="preset-savebar__actions">
                    <button className={`sf-button sf-button--secondary sf-button--md${deleteConfirm ? " is-danger-confirm" : ""}`} onClick={removeClient} type="button">{deleteConfirm ? "삭제 확인" : "삭제"}</button>
                    <button className="sf-button sf-button--primary sf-button--md" disabled={saveState === "saving" || !dirty} onClick={saveClient} type="button">{saveState === "saving" ? "저장 중" : "고객 저장"}</button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
      {loadState === "error" ? <p className="manager-error">{message}</p> : null}
    </div>
  );
}
