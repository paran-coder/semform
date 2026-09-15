"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadIcon, UploadIcon } from "@/components/ui/icons";
import { createFullBackup, downloadJsonFile, readJsonFile, restoreFullBackup, validateFullBackup } from "@/lib/storage/backup";
import { getAllRecords, STORES } from "@/lib/storage/database";

const storeLabels = [
  [STORES.quotes, "견적"],
  [STORES.clients, "고객"],
  [STORES.pricingPresets, "단가 프리셋"],
  [STORES.termPresets, "조건 프리셋"],
] as const;

function dateSlug() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DataManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("데이터는 현재 브라우저에만 저장됩니다.");
  const [working, setWorking] = useState(false);

  async function refreshCounts() {
    const entries = await Promise.all(storeLabels.map(async ([store]) => [store, (await getAllRecords(store)).length] as const));
    setCounts(Object.fromEntries(entries));
  }

  useEffect(() => { void refreshCounts(); }, []);

  async function exportAll() {
    setWorking(true);
    try {
      const backup = await createFullBackup();
      downloadJsonFile(backup, `semform-backup-${dateSlug()}.backup.json`);
      setMessage("전체 백업 파일을 만들었습니다. 로고와 모든 견적·프리셋이 함께 포함됩니다.");
    } catch {
      setMessage("전체 백업 파일을 만들지 못했습니다.");
    } finally {
      setWorking(false);
    }
  }

  async function importAll(file: File) {
    setWorking(true);
    try {
      const parsed = await readJsonFile(file);
      if (!validateFullBackup(parsed)) {
        setMessage("셈폼 전체 백업 파일 형식이 아닙니다.");
        return;
      }
      const summary = storeLabels.map(([store, label]) => `${label} ${parsed.stores[store].length}개`).join(" · ");
      if (!window.confirm(`현재 브라우저의 셈폼 데이터를 백업 파일로 교체합니다.\n\n${summary}\n\n계속할까요?`)) {
        setMessage("복원을 취소했습니다.");
        return;
      }
      await restoreFullBackup(parsed);
      await refreshCounts();
      setMessage("전체 데이터를 복원했습니다. 열려 있던 화면의 기존 데이터는 새로고침 후 최신 값으로 표시됩니다.");
    } catch {
      setMessage("백업 파일을 읽거나 복원하지 못했습니다.");
    } finally {
      setWorking(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="data-manager" aria-labelledby="data-manager-title">
      <div className="data-manager__heading">
        <div>
          <p className="eyebrow">데이터 관리</p>
          <h2 id="data-manager-title">브라우저 데이터를 한 파일로 보관하세요.</h2>
          <p>셈폼은 서버에 고객이나 견적을 저장하지 않습니다. 브라우저 데이터를 삭제하거나 기기를 바꾸기 전 전체 백업을 권장합니다.</p>
        </div>
        <div className="data-manager__counts" aria-label="저장된 데이터 요약">
          {storeLabels.map(([store, label]) => <span key={store}><strong>{counts[store] ?? 0}</strong>{label}</span>)}
        </div>
      </div>

      <div className="data-manager__actions">
        <button className="data-action-card data-action-card--primary" disabled={working} onClick={exportAll} type="button">
          <span className="data-action-card__icon"><DownloadIcon size={20} /></span>
          <span><strong>전체 데이터 백업</strong><small>내 정보, 로고, 고객, 단가·조건 프리셋, 견적과 버전 기록을 JSON 한 파일로 저장합니다.</small></span>
        </button>
        <button className="data-action-card" disabled={working} onClick={() => inputRef.current?.click()} type="button">
          <span className="data-action-card__icon"><UploadIcon size={20} /></span>
          <span><strong>백업 파일 복원</strong><small>기존 데이터를 백업 파일의 내용으로 교체합니다. 실행 전에 포함된 데이터 수를 확인합니다.</small></span>
        </button>
        <input accept=".json,application/json" className="visually-hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importAll(file); }} ref={inputRef} type="file" />
      </div>
      <p className="data-manager__message" role="status">{working ? "데이터를 처리하는 중입니다…" : message}</p>
    </section>
  );
}
