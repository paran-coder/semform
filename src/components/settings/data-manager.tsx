"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadIcon, TrashIcon, UploadIcon } from "@/components/ui/icons";
import { createFullBackup, downloadJsonFile, readJsonFile, restoreFullBackup, validateFullBackup } from "@/lib/storage/backup";
import { BACKUP_REMINDER_DAYS, clearBackupMetadata, getBackupAgeDays, getLastBackupAt, recordBackupNow, shouldRecommendBackup } from "@/lib/storage/backup-meta";
import { clearAllStoreRecords, getAllRecords, STORES } from "@/lib/storage/database";

const storeLabels = [
  [STORES.quotes, "견적"],
  [STORES.clients, "고객"],
  [STORES.pricingPresets, "단가 프리셋"],
  [STORES.termPresets, "조건 프리셋"],
] as const;

const userDataStores = [STORES.profile, STORES.clients, STORES.pricingPresets, STORES.termPresets, STORES.quotes, STORES.settings] as const;

function dateSlug() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "아직 백업하지 않음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "아직 백업하지 않음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function DataManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("데이터는 현재 브라우저에만 저장됩니다.");
  const [working, setWorking] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);

  async function refreshCounts() {
    const entries = await Promise.all(Object.values(STORES).map(async (store) => [store, (await getAllRecords(store)).length] as const));
    setCounts(Object.fromEntries(entries));
  }

  useEffect(() => {
    setLastBackupAt(getLastBackupAt());
    void refreshCounts();
  }, []);

  const hasUserData = userDataStores.some((store) => (counts[store] ?? 0) > 0);
  const backupAgeDays = getBackupAgeDays(lastBackupAt);
  const backupRecommended = shouldRecommendBackup(lastBackupAt, hasUserData);

  async function exportAll() {
    setWorking(true);
    try {
      const backup = await createFullBackup();
      downloadJsonFile(backup, `semform-backup-${dateSlug()}.backup.json`);
      const timestamp = recordBackupNow();
      setLastBackupAt(timestamp);
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

  async function resetAll() {
    const firstConfirmed = window.confirm(
      "셈폼에 저장된 내 정보, 고객, 단가·조건 프리셋, 견적, 버전 기록과 작성 중 임시저장을 모두 삭제합니다.\n\n이 작업은 되돌릴 수 없습니다. 계속할까요?",
    );
    if (!firstConfirmed) {
      setMessage("데이터 초기화를 취소했습니다.");
      return;
    }

    const confirmation = window.prompt('최종 확인입니다. 모든 데이터를 삭제하려면 "초기화"를 입력하세요.');
    if (confirmation?.trim() !== "초기화") {
      setMessage("확인 문구가 일치하지 않아 초기화하지 않았습니다.");
      return;
    }

    setWorking(true);
    try {
      await clearAllStoreRecords();
      clearBackupMetadata();
      setLastBackupAt(null);
      await refreshCounts();
      setMessage("현재 브라우저의 셈폼 데이터를 모두 초기화했습니다.");
    } catch {
      setMessage("데이터를 초기화하지 못했습니다.");
    } finally {
      setWorking(false);
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

      <div className={`backup-status${backupRecommended ? " backup-status--recommended" : ""}`}>
        <div>
          <span className="backup-status__label">마지막 백업</span>
          <strong>{formatDateTime(lastBackupAt)}</strong>
        </div>
        <p>
          {!hasUserData
            ? "저장된 작업 데이터가 생기면 백업 시점을 안내합니다."
            : !lastBackupAt
              ? "아직 전체 백업이 없습니다. 지금 한 번 백업해 두는 것을 권장합니다."
              : backupRecommended
                ? `마지막 백업 후 ${backupAgeDays ?? BACKUP_REMINDER_DAYS}일이 지났습니다. 최신 데이터를 다시 백업해 주세요.`
                : `최근에 백업했습니다. 기본 권장 주기는 ${BACKUP_REMINDER_DAYS}일입니다.`}
        </p>
        {backupRecommended && <span className="backup-status__badge">백업 권장</span>}
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

      <div className="data-danger-zone">
        <div>
          <span className="data-danger-zone__label">위험 영역</span>
          <strong>현재 브라우저 데이터 초기화</strong>
          <p>내 정보, 고객, 프리셋, 견적, 버전 기록과 작성 중 임시저장을 모두 삭제합니다. 백업 파일이 없다면 복구할 수 없습니다.</p>
        </div>
        <button className="data-reset-button" disabled={working} onClick={() => void resetAll()} type="button">
          <TrashIcon size={18} />
          모든 데이터 초기화
        </button>
      </div>

      <p className="data-manager__message" role="status">{working ? "데이터를 처리하는 중입니다…" : message}</p>
    </section>
  );
}
