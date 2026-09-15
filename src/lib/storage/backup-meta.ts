export const BACKUP_REMINDER_DAYS = 14;

const LAST_BACKUP_KEY = "semform:last-backup-at";

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

export function getLastBackupAt(): string | null {
  if (!canUseStorage()) return null;
  const value = window.localStorage.getItem(LAST_BACKUP_KEY);
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function recordBackupNow(): string {
  const value = new Date().toISOString();
  if (canUseStorage()) window.localStorage.setItem(LAST_BACKUP_KEY, value);
  return value;
}

export function clearBackupMetadata() {
  if (canUseStorage()) window.localStorage.removeItem(LAST_BACKUP_KEY);
}

export function getBackupAgeDays(lastBackupAt: string | null): number | null {
  if (!lastBackupAt) return null;
  const timestamp = Date.parse(lastBackupAt);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
}

export function shouldRecommendBackup(lastBackupAt: string | null, hasUserData: boolean) {
  if (!hasUserData) return false;
  const age = getBackupAgeDays(lastBackupAt);
  return age === null || age >= BACKUP_REMINDER_DAYS;
}
