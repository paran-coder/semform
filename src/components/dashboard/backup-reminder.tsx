"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DownloadIcon } from "@/components/ui/icons";
import { BACKUP_REMINDER_DAYS, getBackupAgeDays, getLastBackupAt, shouldRecommendBackup } from "@/lib/storage/backup-meta";
import { getAllRecords, STORES } from "@/lib/storage/database";

const userDataStores = [STORES.profile, STORES.clients, STORES.pricingPresets, STORES.termPresets, STORES.quotes, STORES.settings] as const;

export function BackupReminder() {
  const [state, setState] = useState<{ ready: boolean; hasData: boolean; lastBackupAt: string | null }>({
    ready: false,
    hasData: false,
    lastBackupAt: null,
  });

  useEffect(() => {
    let active = true;
    void Promise.all(userDataStores.map((store) => getAllRecords(store))).then((records) => {
      if (!active) return;
      setState({
        ready: true,
        hasData: records.some((items) => items.length > 0),
        lastBackupAt: getLastBackupAt(),
      });
    }).catch(() => {
      if (active) setState((current) => ({ ...current, ready: true }));
    });
    return () => { active = false; };
  }, []);

  if (!state.ready || !shouldRecommendBackup(state.lastBackupAt, state.hasData)) return null;

  const age = getBackupAgeDays(state.lastBackupAt);
  const description = state.lastBackupAt
    ? `마지막 전체 백업 후 ${age ?? BACKUP_REMINDER_DAYS}일이 지났습니다. 브라우저 데이터가 지워지기 전에 최신 백업을 만들어 두세요.`
    : "아직 전체 백업이 없습니다. 견적과 고객 정보가 현재 브라우저에만 저장되므로 첫 백업을 만들어 두세요.";

  return (
    <aside className="dashboard-backup-reminder" aria-label="백업 권장 안내">
      <span className="dashboard-backup-reminder__icon"><DownloadIcon size={19} /></span>
      <div>
        <strong>데이터 백업을 권장합니다.</strong>
        <p>{description}</p>
      </div>
      <Link href="/settings">백업하기</Link>
    </aside>
  );
}
