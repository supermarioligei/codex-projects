import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { UserRole } from "@/lib/auth";
import { getDataDirectory } from "@/lib/runtime-config";

export type StaffMember = {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  active: boolean;
  createdAt?: string;
};

const dataDirectory = getDataDirectory();
const staffFile = path.join(dataDirectory, "staff.json");

export const seedStaffMembers: StaffMember[] = [
  {
    id: "owner-zhang",
    name: "张总",
    role: "owner",
    title: "经营负责人",
    active: true,
  },
  {
    id: "sales-lin",
    name: "小林",
    role: "sales",
    title: "客服统筹",
    active: true,
  },
  {
    id: "sales-xiaohe",
    name: "小禾",
    role: "sales",
    title: "交付跟进",
    active: true,
  },
  {
    id: "photographer-afeng",
    name: "阿峰",
    role: "photographer",
    title: "主摄影师",
    active: true,
  },
  {
    id: "photographer-ziyu",
    name: "子瑜",
    role: "photographer",
    title: "跟拍摄影师",
    active: true,
  },
  {
    id: "photographer-anan",
    name: "安安",
    role: "photographer",
    title: "外景摄影师",
    active: true,
  },
];

async function ensureStaffFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(staffFile, "utf8");
  } catch {
    await writeFile(staffFile, JSON.stringify(seedStaffMembers, null, 2), "utf8");
  }
}

async function readStoredStaff(): Promise<StaffMember[]> {
  await ensureStaffFile();

  const raw = await readFile(staffFile, "utf8");
  const parsed = JSON.parse(raw) as StaffMember[];

  return parsed.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
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
  role: UserRole;
  title: string;
  active: boolean;
}) {
  const staff = await readStoredStaff();
  const member: StaffMember = {
    id: toStaffId(input.role, input.name),
    name: input.name.trim(),
    role: input.role,
    title: input.title.trim(),
    active: input.active,
    createdAt: new Date().toISOString(),
  };

  const nextStaff = [...staff, member].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  await writeStoredStaff(nextStaff);
  return member;
}

export async function updateStaffMember(
  id: string,
  input: {
    name: string;
    role: UserRole;
    title: string;
    active: boolean;
  },
) {
  const staff = await readStoredStaff();
  const target = staff.find((member) => member.id === id);

  if (!target) {
    return null;
  }

  const nextStaff = staff
    .map((member) =>
      member.id === id
        ? {
            ...member,
            name: input.name.trim(),
            role: input.role,
            title: input.title.trim(),
            active: input.active,
          }
        : member,
    )
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

  await writeStoredStaff(nextStaff);
  return nextStaff.find((member) => member.id === id) ?? null;
}

export async function canLoginWithRole(name: string, role: UserRole) {
  const staff = await getStaffMembers();
  return staff.some((member) => member.active && member.role === role && member.name === name.trim());
}
