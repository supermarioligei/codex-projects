import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getFinanceEntries } from "@/lib/finance-store";
import { seedOrders, type Order, type OrderStatus, type ShootPeriod } from "@/lib/mock-data";
import { getDataDirectory } from "@/lib/runtime-config";

const dataDirectory = getDataDirectory();
const ordersFile = path.join(dataDirectory, "orders.json");

export type CreateOrderInput = {
  customer: string;
  contact: string;
  school: string;
  campus: string;
  className: string;
  signingClerk: string;
  location: string;
  shootDate: string;
  shootPeriod: ShootPeriod;
  peopleCount: string;
  clothingType: string;
  packageName: string;
  amount: number;
  paid: number;
  status: OrderStatus;
  salesOwner: string;
  director: string;
  photographer: string;
  assistantPhotographer: string;
  leadVideographer: string;
  assistantVideographer: string;
  deliveryDueDate: string;
  notes: string;
};

export type UpdateOrderInput = {
  customer: string;
  contact: string;
  school: string;
  campus: string;
  className: string;
  signingClerk: string;
  location: string;
  shootDate: string;
  shootPeriod: ShootPeriod;
  peopleCount: string;
  clothingType: string;
  packageName: string;
  amount: number;
  status: OrderStatus;
  salesOwner: string;
  director: string;
  photographer: string;
  assistantPhotographer: string;
  leadVideographer: string;
  assistantVideographer: string;
  deliveryDueDate: string;
  notes: string;
};

type StoredOrder = Order & {
  notes?: string;
  createdAt?: string;
};

export type OrderWithFinanceSummary = StoredOrder & {
  receivedTotal: number;
  outstandingAmount: number;
  linkedFinanceCount: number;
};

async function ensureOrdersFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(ordersFile, "utf8");
  } catch {
    await writeFile(ordersFile, JSON.stringify(seedOrders, null, 2), "utf8");
  }
}

async function readStoredOrders(): Promise<StoredOrder[]> {
  await ensureOrdersFile();

  const raw = await readFile(ordersFile, "utf8");
  const parsed = JSON.parse(raw) as StoredOrder[];

  return parsed.sort((a, b) => a.shootDate.localeCompare(b.shootDate));
}

function parseCurrency(value: string) {
  return Number(value.replace(/[^\d.-]/g, "")) || 0;
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN")}`;
}

function toOrderId() {
  const stamp = new Date()
    .toISOString()
    .slice(2, 10)
    .replaceAll("-", "");
  const random = Math.floor(Math.random() * 900 + 100);

  return `ORD-${stamp}-${random}`;
}

function normalizeShootDate(value: string) {
  if (!value) {
    return "";
  }

  return value.replace("T", " ");
}

export async function createOrder(input: CreateOrderInput) {
  const existing = await readStoredOrders();

  const order: StoredOrder = {
    id: toOrderId(),
    customer: input.customer,
    contact: input.contact,
    school: input.school,
    campus: input.campus,
    className: input.className,
    signingClerk: input.signingClerk,
    shootDate: normalizeShootDate(input.shootDate),
    shootPeriod: input.shootPeriod,
    peopleCount: input.peopleCount,
    clothingType: input.clothingType,
    location: input.location,
    packageName: input.packageName,
    amount: formatCurrency(input.amount),
    paid: formatCurrency(input.paid),
    status: input.status,
    salesOwner: input.salesOwner,
    director: input.director,
    photographer: input.photographer,
    assistantPhotographer: input.assistantPhotographer,
    leadVideographer: input.leadVideographer,
    assistantVideographer: input.assistantVideographer,
    deliveryDueDate: input.deliveryDueDate,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };

  const nextOrders = [...existing, order].sort((a, b) =>
    a.shootDate.localeCompare(b.shootDate),
  );

  await writeFile(ordersFile, JSON.stringify(nextOrders, null, 2), "utf8");

  return order;
}

export async function updateOrder(orderId: string, input: UpdateOrderInput) {
  const existing = await readStoredOrders();
  const target = existing.find((order) => order.id === orderId);

  if (!target) {
    return null;
  }

  const nextOrders = existing
    .map((order) =>
      order.id === orderId
        ? {
            ...order,
            customer: input.customer,
            contact: input.contact,
            school: input.school,
            campus: input.campus,
            className: input.className,
            signingClerk: input.signingClerk,
            location: input.location,
            shootDate: normalizeShootDate(input.shootDate),
            shootPeriod: input.shootPeriod,
            peopleCount: input.peopleCount,
            clothingType: input.clothingType,
            packageName: input.packageName,
            amount: formatCurrency(input.amount),
            status: input.status,
            salesOwner: input.salesOwner,
            director: input.director,
            photographer: input.photographer,
            assistantPhotographer: input.assistantPhotographer,
            leadVideographer: input.leadVideographer,
            assistantVideographer: input.assistantVideographer,
            deliveryDueDate: input.deliveryDueDate,
            notes: input.notes,
          }
        : order,
    )
    .sort((a, b) => a.shootDate.localeCompare(b.shootDate));

  await writeFile(ordersFile, JSON.stringify(nextOrders, null, 2), "utf8");

  return nextOrders.find((order) => order.id === orderId) ?? null;
}

export async function getOrders(): Promise<OrderWithFinanceSummary[]> {
  const [orders, financeEntries] = await Promise.all([
    readStoredOrders(),
    getFinanceEntries(),
  ]);

  return orders.map((order) => {
    const linkedEntries = financeEntries.filter((entry) => entry.orderId === order.id);
    const receivedTotal = linkedEntries.reduce((sum, entry) => {
      const amount = parseCurrency(entry.amount);

      if (entry.type === "收款") {
        return sum + amount;
      }

      if (entry.type === "退款") {
        return sum - amount;
      }

      return sum;
    }, 0);
    const totalAmount = parseCurrency(order.amount);

    return {
      ...order,
      paid: formatCurrency(receivedTotal),
      receivedTotal,
      outstandingAmount: Math.max(totalAmount - receivedTotal, 0),
      linkedFinanceCount: linkedEntries.length,
    };
  });
}

export async function getOrderById(orderId: string) {
  const orders = await getOrders();
  return orders.find((order) => order.id === orderId) ?? null;
}

type PhotographerConflictOptions = {
  photographer: string;
  shootDate: string;
  shootPeriod?: string;
  excludeOrderId?: string;
};

function normalizeName(value: string) {
  return value.replace(/\s+/g, "").trim();
}

export async function findPhotographerConflict({
  photographer,
  shootDate,
  shootPeriod,
  excludeOrderId,
}: PhotographerConflictOptions) {
  const currentPhotographer = normalizeName(photographer);
  const currentShootDate = normalizeShootDate(shootDate);
  const currentShootPeriod = String(shootPeriod ?? "").trim();

  if (!currentPhotographer || !currentShootDate) {
    return null;
  }

  const orders = await readStoredOrders();

  return (
    orders.find((order) => {
      if (excludeOrderId && order.id === excludeOrderId) {
        return false;
      }

      return (
        normalizeName(order.photographer ?? "") === currentPhotographer &&
        normalizeShootDate(order.shootDate) === currentShootDate &&
        String(order.shootPeriod ?? "").trim() === currentShootPeriod
      );
    }) ?? null
  );
}

function normalizeClothing(value: string) {
  return value.trim();
}

function sameShootDay(left: string, right: string) {
  return normalizeShootDate(left).slice(0, 10) === normalizeShootDate(right).slice(0, 10);
}

export async function getClothingUsageCount(options: {
  clothingType: string;
  shootDate: string;
  excludeOrderId?: string;
}) {
  const currentClothing = normalizeClothing(options.clothingType);
  const currentShootDate = normalizeShootDate(options.shootDate);

  if (!currentClothing || !currentShootDate) {
    return 0;
  }

  const orders = await readStoredOrders();
  return orders.filter((order) => {
    if (options.excludeOrderId && order.id === options.excludeOrderId) {
      return false;
    }

    return (
      normalizeClothing(order.clothingType ?? "") === currentClothing &&
      sameShootDay(order.shootDate, currentShootDate)
    );
  }).length;
}
