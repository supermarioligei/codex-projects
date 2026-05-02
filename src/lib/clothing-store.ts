import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDataDirectory } from "@/lib/runtime-config";

export type ClothingOption = {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
};

const dataDirectory = getDataDirectory();
const clothingFile = path.join(dataDirectory, "clothing.json");

const seedClothingOptions: ClothingOption[] = [
  { id: "clothing-college", name: "学院风", active: true },
  { id: "clothing-gown", name: "学士服", active: true },
  { id: "clothing-sailor", name: "海军风", active: true },
];

async function ensureClothingFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(clothingFile, "utf8");
  } catch {
    await writeFile(clothingFile, JSON.stringify(seedClothingOptions, null, 2), "utf8");
  }
}

async function readStoredClothing(): Promise<ClothingOption[]> {
  await ensureClothingFile();
  const raw = await readFile(clothingFile, "utf8");
  const parsed = JSON.parse(raw) as ClothingOption[];

  return parsed.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

async function writeStoredClothing(options: ClothingOption[]) {
  await writeFile(clothingFile, JSON.stringify(options, null, 2), "utf8");
}

function toClothingId(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "");

  return `clothing-${normalized || "item"}-${Math.floor(Math.random() * 900 + 100)}`;
}

export async function getClothingOptions(options?: { includeInactive?: boolean }) {
  const all = await readStoredClothing();

  if (options?.includeInactive) {
    return all;
  }

  return all.filter((item) => item.active);
}

export async function createClothingOption(input: { name: string; active: boolean }) {
  const all = await readStoredClothing();
  const normalizedName = input.name.trim();

  if (!normalizedName) {
    return { error: "missing-name" as const };
  }

  if (all.some((item) => item.name === normalizedName)) {
    return { error: "duplicate-name" as const };
  }

  const next: ClothingOption = {
    id: toClothingId(normalizedName),
    name: normalizedName,
    active: input.active,
    createdAt: new Date().toISOString(),
  };

  const merged = [...all, next].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  await writeStoredClothing(merged);
  return { option: next };
}

export async function updateClothingOption(
  id: string,
  input: { name: string; active: boolean },
) {
  const all = await readStoredClothing();
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

  await writeStoredClothing(merged);
  return { option: merged.find((item) => item.id === id) ?? null };
}
