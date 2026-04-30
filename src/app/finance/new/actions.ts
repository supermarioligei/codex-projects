"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createFinanceEntry } from "@/lib/finance-store";
import { getOrders } from "@/lib/order-store";
import type { FinanceEntryType } from "@/lib/mock-data";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readAmount(formData: FormData, key: string) {
  const value = Number(readText(formData, key));
  return Number.isFinite(value) ? value : 0;
}

export async function createFinanceEntryAction(formData: FormData) {
  const type = readText(formData, "type") as FinanceEntryType;
  const title = readText(formData, "title");
  const amount = readAmount(formData, "amount");
  const happenedAt = readText(formData, "happenedAt");
  const orderId = readText(formData, "orderId");
  const category = readText(formData, "category");
  const counterparty = readText(formData, "counterparty");
  const notes = readText(formData, "notes");

  if (!type || !title || !amount) {
    redirect("/finance/new?error=missing");
  }

  const orders = await getOrders();
  const matchedOrder = orders.find((order) => order.id === orderId);

  await createFinanceEntry({
    type,
    title,
    amount,
    happenedAt,
    orderId: matchedOrder?.id,
    orderLabel: matchedOrder?.customer,
    category,
    counterparty,
    notes,
  });

  revalidatePath("/");
  revalidatePath("/finance");
  redirect("/finance?created=1");
}
