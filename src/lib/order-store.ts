import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getFinanceEntries } from "@/lib/finance-store";
import { seedOrders, type Order, type OrderStatus } from "@/lib/mock-data";

const dataDirectory = path.join(process.cwd(), "data");
const ordersFile = path.join(dataDirectory, "orders.json");

export type CreateOrderInput = {
  customer: string;
  contact: string;
  school: string;
  campus: string;
  className: string;
  location: string;
  shootDate: string;
  packageName: string;
  amount: number;
  paid: number;
  status: OrderStatus;
  photographer: string;
  notes: string;
};

export type UpdateOrderInput = {
  customer: string;
  contact: string;
  school: string;
  campus: string;
  className: string;
  location: string;
  shootDate: string;
  packageName: string;
  amount: number;
  status: OrderStatus;
  photographer: string;
  notes: string;
};

type StoredOrder = Order & {
  photographer?: string;
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
    shootDate: normalizeShootDate(input.shootDate),
    location: input.location,
    packageName: input.packageName,
    amount: formatCurrency(input.amount),
    paid: formatCurrency(input.paid),
    status: input.status,
    photographer: input.photographer,
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
            location: input.location,
            shootDate: normalizeShootDate(input.shootDate),
            packageName: input.packageName,
            amount: formatCurrency(input.amount),
            status: input.status,
            photographer: input.photographer,
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
  excludeOrderId?: string;
};

function normalizeName(value: string) {
  return value.replace(/\s+/g, "").trim();
}

export async function findPhotographerConflict({
  photographer,
  shootDate,
  excludeOrderId,
}: PhotographerConflictOptions) {
  const currentPhotographer = normalizeName(photographer);
  const currentShootDate = normalizeShootDate(shootDate);

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
        normalizeShootDate(order.shootDate) === currentShootDate
      );
    }) ?? null
  );
}
