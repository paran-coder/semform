import { APP_CONFIG } from "@/config/app";
import { getAllRecords, replaceAllStoreRecords, STORES, type StoreName } from "@/lib/storage/database";
import { createId } from "@/lib/ids";
import { generateQuoteNumber } from "@/lib/quote-number";
import type { Client } from "@/types/client";
import type { Quote } from "@/types/quote";

export const BACKUP_FORMAT = "semform-backup" as const;
export const QUOTE_FILE_FORMAT = "semform-quote" as const;
export const BACKUP_VERSION = 1;

export type SemformBackupFile = {
  format: typeof BACKUP_FORMAT;
  backupVersion: number;
  appVersion: string;
  exportedAt: string;
  stores: Record<StoreName, unknown[]>;
};

export type SemformQuoteFile = {
  format: typeof QUOTE_FILE_FORMAT;
  fileVersion: number;
  appVersion: string;
  exportedAt: string;
  quote: Quote;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function createFullBackup(): Promise<SemformBackupFile> {
  const entries = await Promise.all(Object.values(STORES).map(async (storeName) => [storeName, await getAllRecords(storeName)] as const));
  return {
    format: BACKUP_FORMAT,
    backupVersion: BACKUP_VERSION,
    appVersion: APP_CONFIG.version,
    exportedAt: new Date().toISOString(),
    stores: Object.fromEntries(entries) as Record<StoreName, unknown[]>,
  };
}

export function validateFullBackup(value: unknown): value is SemformBackupFile {
  if (!isObject(value) || value.format !== BACKUP_FORMAT || typeof value.backupVersion !== "number" || !isObject(value.stores)) return false;
  const stores = value.stores as Record<string, unknown>;
  return value.backupVersion === BACKUP_VERSION && Object.values(STORES).every((storeName) => Array.isArray(stores[storeName]));
}

export async function restoreFullBackup(file: SemformBackupFile): Promise<void> {
  const storeRecords = Object.fromEntries(Object.values(STORES).map((storeName) => [storeName, file.stores[storeName] ?? []])) as Record<StoreName, unknown[]>;
  await replaceAllStoreRecords(storeRecords);
}

export function createQuoteFile(quote: Quote): SemformQuoteFile {
  return {
    format: QUOTE_FILE_FORMAT,
    fileVersion: 1,
    appVersion: APP_CONFIG.version,
    exportedAt: new Date().toISOString(),
    quote,
  };
}

export function validateQuoteFile(value: unknown): value is SemformQuoteFile {
  if (!isObject(value) || value.format !== QUOTE_FILE_FORMAT || value.fileVersion !== 1 || !isObject(value.quote)) return false;
  const quote = value.quote;
  return typeof quote.projectName === "string" && typeof quote.total === "number" && Array.isArray(quote.items) && isObject(quote.client);
}

export async function importQuoteFile(file: SemformQuoteFile): Promise<Quote> {
  const [existing, clients] = await Promise.all([
    getAllRecords<Quote>(STORES.quotes),
    getAllRecords<Client>(STORES.clients),
  ]);
  const sourceClient = file.quote.client;
  const normalized = (value: string) => value.trim().toLocaleLowerCase("ko-KR");
  const matchedClient = clients.find((client) => {
    if (file.quote.clientId && client.id === file.quote.clientId) return true;
    if (sourceClient.businessNumber && client.businessNumber === sourceClient.businessNumber) return true;
    if (sourceClient.email && normalized(client.email) === normalized(sourceClient.email)) return true;
    return Boolean(sourceClient.companyName) && normalized(client.companyName) === normalized(sourceClient.companyName);
  });
  const timestamp = new Date().toISOString();
  const imported: Quote = {
    ...file.quote,
    id: createId("quote"),
    quoteNumber: generateQuoteNumber(existing),
    clientId: matchedClient?.id ?? "",
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return imported;
}

export function downloadJsonFile(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function readJsonFile(file: File): Promise<unknown> {
  const text = await file.text();
  return JSON.parse(text) as unknown;
}

export function safeFilename(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80) || "semform";
}
