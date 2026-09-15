import { deleteRecord, getRecord, putRecord, STORES } from "@/lib/storage/database";

export type LocalDraft<T> = {
  id: string;
  value: T;
  updatedAt: string;
};

export async function getLocalDraft<T>(id: string): Promise<T | null> {
  const record = await getRecord<LocalDraft<T>>(STORES.settings, id);
  return record?.value ?? null;
}

export async function saveLocalDraft<T>(id: string, value: T): Promise<void> {
  await putRecord(STORES.settings, {
    id,
    value,
    updatedAt: new Date().toISOString(),
  } satisfies LocalDraft<T>);
}

export async function clearLocalDraft(id: string): Promise<void> {
  await deleteRecord(STORES.settings, id);
}
