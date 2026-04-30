import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  seedFinanceEntries,
  type FinanceEntry,
  type FinanceEntryType,
} from "@/lib/mock-data";

const dataDirectory = path.join(process.cwd(), "data");
const financeFile = path.join(dataDirectory, "finance.json");

export type CreateFinanceEntryInput = {
  type: FinanceEntryType;
  title: string;
  amount: number;
  happenedAt: string;
  orderId?: string;
  orderLabel?: string;
  category?: string;
  counterparty?: string;
  notes?: string;
};

export type UpdateFinanceEntryInput = {
  type: FinanceEntryType;
  title: string;
  amount: number;
  happenedAt: string;
  orderId?: string;
  orderLabel?: string;
  category?: string;
  counterparty?: string;
  notes?: string;
};

async function ensureFinanceFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(financeFile, "utf8");
  } catch {
    await writeFile(financeFile, JSON.stringify(seedFinanceEntries, null, 2), "utf8");
  }
}

function parseTimeValue(value: string) {
  return value.replace("今天 ", "").replace("昨天 ", "");
}

export async function getFinanceEntries(): Promise<FinanceEntry[]> {
  await ensureFinanceFile();

  const raw = await readFile(financeFile, "utf8");
  const parsed = JSON.parse(raw) as FinanceEntry[];

  return parsed.sort((a, b) => {
    const textCompare = b.time.localeCompare(a.time);
    if (textCompare !== 0) {
      return textCompare;
    }

    return parseTimeValue(b.time).localeCompare(parseTimeValue(a.time));
  });
}

export async function getFinanceEntriesByOrderId(orderId: string) {
  const entries = await getFinanceEntries();
  return entries.filter((entry) => entry.orderId === orderId);
}

export async function getFinanceEntryById(entryId: string) {
  const entries = await getFinanceEntries();
  return entries.find((entry) => entry.id === entryId) ?? null;
}

function formatAmount(type: FinanceEntryType, amount: number) {
  const sign = type === "收款" ? "+" : "-";
  return `${sign}¥${amount.toLocaleString("zh-CN")}`;
}

function formatDisplayTime(value: string) {
  if (!value) {
    return new Date().toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return value.replace("T", " ");
}

function toFinanceId() {
  const stamp = new Date()
    .toISOString()
    .slice(2, 10)
    .replaceAll("-", "");
  const random = Math.floor(Math.random() * 900 + 100);

  return `FIN-${stamp}-${random}`;
}

export async function createFinanceEntry(input: CreateFinanceEntryInput) {
  const entries = await getFinanceEntries();
  const entry: FinanceEntry = {
    id: toFinanceId(),
    type: input.type,
    title: input.title,
    amount: formatAmount(input.type, input.amount),
    time: formatDisplayTime(input.happenedAt),
    orderId: input.orderId,
    orderLabel: input.orderLabel,
    category: input.category,
    counterparty: input.counterparty,
    notes: input.notes,
  };

  const nextEntries = [entry, ...entries];
  await writeFile(financeFile, JSON.stringify(nextEntries, null, 2), "utf8");

  return entry;
}

export async function updateFinanceEntry(
  entryId: string,
  input: UpdateFinanceEntryInput,
) {
  const entries = await getFinanceEntries();
  const target = entries.find((entry) => entry.id === entryId);

  if (!target) {
    return null;
  }

  const updatedEntry: FinanceEntry = {
    ...target,
    type: input.type,
    title: input.title,
    amount: formatAmount(input.type, input.amount),
    time: input.happenedAt ? formatDisplayTime(input.happenedAt) : target.time,
    orderId: input.orderId,
    orderLabel: input.orderLabel,
    category: input.category,
    counterparty: input.counterparty,
    notes: input.notes,
  };

  const nextEntries = entries.map((entry) =>
    entry.id === entryId ? updatedEntry : entry,
  );

  await writeFile(financeFile, JSON.stringify(nextEntries, null, 2), "utf8");

  return updatedEntry;
}
