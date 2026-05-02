import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDataDirectory } from "@/lib/runtime-config";

export type PackageOption = {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
};

const dataDirectory = getDataDirectory();
const packageFile = path.join(dataDirectory, "packages.json");

const seedPackageOptions: PackageOption[] = [
  { id: "package-grad-full", name: "毕业纪念全套", active: true },
  { id: "package-class-outdoor", name: "班级合影 + 外景", active: true },
  { id: "package-ceremony", name: "毕业典礼跟拍", active: true },
  { id: "package-id-group", name: "证件照 + 集体照", active: true },
];

async function ensurePackageFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(packageFile, "utf8");
  } catch {
    await writeFile(packageFile, JSON.stringify(seedPackageOptions, null, 2), "utf8");
  }
}

async function readStoredPackages(): Promise<PackageOption[]> {
  await ensurePackageFile();
  const raw = await readFile(packageFile, "utf8");
  const parsed = JSON.parse(raw) as PackageOption[];

  return parsed.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

async function writeStoredPackages(options: PackageOption[]) {
  await writeFile(packageFile, JSON.stringify(options, null, 2), "utf8");
}

function toPackageId(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "");

  return `package-${normalized || "item"}-${Math.floor(Math.random() * 900 + 100)}`;
}

export async function getPackageOptions(options?: { includeInactive?: boolean }) {
  const all = await readStoredPackages();

  if (options?.includeInactive) {
    return all;
  }

  return all.filter((item) => item.active);
}

export async function createPackageOption(input: { name: string; active: boolean }) {
  const all = await readStoredPackages();
  const normalizedName = input.name.trim();

  if (!normalizedName) {
    return { error: "missing-name" as const };
  }

  if (all.some((item) => item.name === normalizedName)) {
    return { error: "duplicate-name" as const };
  }

  const next: PackageOption = {
    id: toPackageId(normalizedName),
    name: normalizedName,
    active: input.active,
    createdAt: new Date().toISOString(),
  };

  const merged = [...all, next].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  await writeStoredPackages(merged);
  return { option: next };
}

export async function updatePackageOption(
  id: string,
  input: { name: string; active: boolean },
) {
  const all = await readStoredPackages();
  const target = all.find((item) => item.id === id);

  if (!target) {
    return { error: "not-found" as const };
  }

  const normalizedName = input.name.trim();

  if (!normalizedName) {
    return { error: "missing-name" as const };
  }

  if (all.some((item) => item.id !== id && item.name === normalizedName)) {
    return { error: "duplicate-name" as const };
  }

  const merged = all
    .map((item) =>
      item.id === id
        ? {
            ...item,
            name: normalizedName,
            active: input.active,
          }
        : item,
    )
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

  await writeStoredPackages(merged);
  return { option: merged.find((item) => item.id === id) ?? null };
}
