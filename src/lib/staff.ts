import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import path from "node:path";
import type { UserRole } from "@/lib/auth";
import { getDataDirectory } from "@/lib/runtime-config";

const scrypt = promisify(scryptCallback);

export type StaffMember = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  title: string;
  active: boolean;
  passwordSalt: string;
  passwordHash: string;
  createdAt?: string;
};

const dataDirectory = getDataDirectory();
const staffFile = path.join(dataDirectory, "staff.json");
export const DEFAULT_TEMP_PASSWORD = "Tongying2026!";

export const seedStaffMembers: StaffMember[] = [
  {
    id: "owner-zhang",
    name: "张总",
    username: "zhang",
    role: "owner",
    title: "经营负责人",
    active: true,
    passwordSalt: "seed-owner-zhang",
    passwordHash: "",
  },
  {
    id: "sales-lin",
    name: "小林",
    username: "xiaolin",
    role: "sales",
    title: "客服统筹",
    active: true,
    passwordSalt: "seed-sales-lin",
    passwordHash: "",
  },
  {
    id: "sales-xiaohe",
    name: "小禾",
    username: "xiaohe",
    role: "sales",
    title: "交付跟进",
    active: true,
    passwordSalt: "seed-sales-xiaohe",
    passwordHash: "",
  },
  {
    id: "photographer-afeng",
    name: "阿峰",
    username: "afeng",
    role: "photographer",
    title: "主摄影师",
    active: true,
    passwordSalt: "seed-photographer-afeng",
    passwordHash: "",
  },
  {
    id: "photographer-ziyu",
    name: "子瑜",
    username: "ziyu",
    role: "photographer",
    title: "跟拍摄影师",
    active: true,
    passwordSalt: "seed-photographer-ziyu",
    passwordHash: "",
  },
  {
    id: "photographer-anan",
    name: "安安",
    username: "anan",
    role: "photographer",
    title: "外景摄影师",
    active: true,
    passwordSalt: "seed-photographer-anan",
    passwordHash: "",
  },
];

async function hashPassword(password: string, salt: string) {
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return derived.toString("hex");
}

async function buildSeedStaffMembers() {
  return Promise.all(
    seedStaffMembers.map(async (member) => ({
      ...member,
      passwordHash: await hashPassword(DEFAULT_TEMP_PASSWORD, member.passwordSalt),
    })),
  );
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function fallbackUsername(member: Pick<StaffMember, "id" | "name" | "role">) {
  const byId = member.id.split("-").slice(1).join("-").trim();

  if (byId) {
    return normalizeUsername(byId);
  }

  return normalizeUsername(`${member.role}-${member.name}`);
}

async function normalizeStaffRecord(member: Partial<StaffMember> & Pick<StaffMember, "id" | "name" | "role" | "title" | "active">) {
  const username = normalizeUsername(member.username ?? fallbackUsername(member));
  const passwordSalt = member.passwordSalt?.trim() || `legacy-${member.id}`;
  const passwordHash =
    member.passwordHash?.trim() || (await hashPassword(DEFAULT_TEMP_PASSWORD, passwordSalt));

  return {
    ...member,
    username,
    passwordSalt,
    passwordHash,
  } as StaffMember;
}

async function ensureStaffFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(staffFile, "utf8");
  } catch {
    const initialStaff = await buildSeedStaffMembers();
    await writeFile(staffFile, JSON.stringify(initialStaff, null, 2), "utf8");
  }
}

async function readStoredStaff(): Promise<StaffMember[]> {
  await ensureStaffFile();

  const raw = await readFile(staffFile, "utf8");
  const parsed = JSON.parse(raw) as Array<
    Partial<StaffMember> & Pick<StaffMember, "id" | "name" | "role" | "title" | "active">
  >;
  const normalized = await Promise.all(parsed.map((member) => normalizeStaffRecord(member)));
  const hadLegacyRecords = normalized.some((member, index) => {
    const original = parsed[index];
    return (
      !original.username ||
      !original.passwordSalt ||
      !original.passwordHash
    );
  });

  if (hadLegacyRecords) {
    await writeStoredStaff(normalized);
  }

  return normalized.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

async function writeStoredStaff(staff: StaffMember[]) {
  await writeFile(staffFile, JSON.stringify(staff, null, 2), "utf8");
}

function toStaffId(role: UserRole, name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "");
  const random = Math.floor(Math.random() * 900 + 100);

  return `${role}-${normalized || "member"}-${random}`;
}

function createPasswordSalt() {
  return randomBytes(12).toString("hex");
}

type StaffListOptions = {
  includeInactive?: boolean;
};

export async function getStaffMembers(options: StaffListOptions = {}) {
  const staff = await readStoredStaff();

  if (options.includeInactive) {
    return staff;
  }

  return staff.filter((member) => member.active);
}

export async function getActiveStaffMembers() {
  return getStaffMembers();
}

export async function getStaffByRole(role: UserRole, options: StaffListOptions = {}) {
  const staff = await getStaffMembers(options);
  return staff.filter((member) => member.role === role);
}

export async function getActiveStaffByRole(role: UserRole) {
  return getStaffByRole(role);
}

export async function getStaffMemberById(id: string) {
  const staff = await readStoredStaff();
  return staff.find((member) => member.id === id) ?? null;
}

export async function createStaffMember(input: {
  name: string;
  username: string;
  role: UserRole;
  title: string;
  active: boolean;
  password: string;
}) {
  const staff = await readStoredStaff();
  const username = normalizeUsername(input.username);

  if (staff.some((member) => normalizeUsername(member.username) === username)) {
    return { error: "username-exists" as const };
  }

  const passwordSalt = createPasswordSalt();
  const member: StaffMember = {
    id: toStaffId(input.role, input.name),
    name: input.name.trim(),
    username,
    role: input.role,
    title: input.title.trim(),
    active: input.active,
    passwordSalt,
    passwordHash: await hashPassword(input.password, passwordSalt),
    createdAt: new Date().toISOString(),
  };

  const nextStaff = [...staff, member].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  await writeStoredStaff(nextStaff);
  return { member };
}

export async function updateStaffMember(
  id: string,
  input: {
    name: string;
    username: string;
    role: UserRole;
    title: string;
    active: boolean;
    password?: string;
  },
) {
  const staff = await readStoredStaff();
  const target = staff.find((member) => member.id === id);

  if (!target) {
    return { error: "not-found" as const };
  }

  const username = normalizeUsername(input.username);

  if (
    staff.some(
      (member) =>
        member.id !== id && normalizeUsername(member.username) === username,
    )
  ) {
    return { error: "username-exists" as const };
  }

  const nextPasswordSalt = input.password?.trim() ? createPasswordSalt() : target.passwordSalt;
  const nextPasswordHash = input.password?.trim()
    ? await hashPassword(input.password.trim(), nextPasswordSalt)
    : target.passwordHash;

  const nextStaff = staff
    .map((member) =>
      member.id === id
        ? {
            ...member,
            name: input.name.trim(),
            username,
            role: input.role,
            title: input.title.trim(),
            active: input.active,
            passwordSalt: nextPasswordSalt,
            passwordHash: nextPasswordHash,
          }
        : member,
    )
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

  await writeStoredStaff(nextStaff);
  return { member: nextStaff.find((member) => member.id === id) ?? null };
}

export async function authenticateStaffAccount(username: string, password: string) {
  const staff = await getStaffMembers();
  const account = staff.find(
    (member) => member.active && normalizeUsername(member.username) === normalizeUsername(username),
  );

  if (!account) {
    return null;
  }

  const passwordHash = await hashPassword(password, account.passwordSalt);
  const matches = timingSafeEqual(
    Buffer.from(passwordHash, "hex"),
    Buffer.from(account.passwordHash, "hex"),
  );

  if (!matches) {
    return null;
  }

  return account;
}
