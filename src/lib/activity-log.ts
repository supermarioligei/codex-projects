import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { UserRole } from "@/lib/auth";
import { getDataDirectory } from "@/lib/runtime-config";

const dataDirectory = getDataDirectory();
const activityFile = path.join(dataDirectory, "activity-log.json");

export type ActivityActor = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
};

export type ActivityLogEntry = {
  id: string;
  happenedAt: string;
  action: string;
  entityType: "order" | "finance" | "staff" | "clothing" | "package";
  entityId: string;
  entityLabel: string;
  summary: string;
  actor: ActivityActor;
};

async function ensureActivityFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(activityFile, "utf8");
  } catch {
    await writeFile(activityFile, JSON.stringify([], null, 2), "utf8");
  }
}

async function readActivityLog(): Promise<ActivityLogEntry[]> {
  await ensureActivityFile();

  const raw = await readFile(activityFile, "utf8");
  const parsed = JSON.parse(raw) as ActivityLogEntry[];

  return parsed.sort((a, b) => b.happenedAt.localeCompare(a.happenedAt));
}

function toActivityId() {
  const stamp = new Date()
    .toISOString()
    .slice(2, 10)
    .replaceAll("-", "");
  const random = Math.floor(Math.random() * 900 + 100);

  return `ACT-${stamp}-${random}`;
}

export async function createActivityLog(input: Omit<ActivityLogEntry, "id" | "happenedAt">) {
  const existing = await readActivityLog();
  const entry: ActivityLogEntry = {
    ...input,
    id: toActivityId(),
    happenedAt: new Date().toISOString(),
  };

  await writeFile(activityFile, JSON.stringify([entry, ...existing], null, 2), "utf8");

  return entry;
}

export async function getActivityLogs(limit?: number) {
  const entries = await readActivityLog();
  return typeof limit === "number" ? entries.slice(0, limit) : entries;
}
