"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createActivityLog } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth";
import { getFinanceEntryById, updateFinanceEntry } from "@/lib/finance-store";
import { getOrders } from "@/lib/order-store";
import type { FinanceEntryType } from "@/lib/mock-data";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readAmount(formData: FormData, key: string) {
  const value = Number(readText(formData, key));
  return Number.isFinite(value) ? value : 0;
}

export async function updateFinanceEntryAction(formData: FormData) {
  const user = await requireSession(["owner"]);
  const entryId = readText(formData, "entryId");
  const type = readText(formData, "type") as FinanceEntryType;
  const title = readText(formData, "title");
  const amount = readAmount(formData, "amount");
  const happenedAt = readText(formData, "happenedAt");
  const orderId = readText(formData, "orderId");
  const category = readText(formData, "category");
  const counterparty = readText(formData, "counterparty");
  const notes = readText(formData, "notes");

  if (!entryId || !type || !title || !amount) {
    redirect(`/finance/${entryId}/edit?error=missing`);
  }

  const previous = await getFinanceEntryById(entryId);
  const orders = await getOrders();
  const matchedOrder = orders.find((order) => order.id === orderId);

  const updated = await updateFinanceEntry(entryId, {
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

  if (!updated) {
    redirect("/finance");
  }

  await createActivityLog({
    action: "update",
    entityType: "finance",
    entityId: updated.id,
    entityLabel: updated.title,
    summary: `更新${updated.type}流水 ${updated.title}`,
    actor: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/finance");
  if (previous?.orderId) {
    revalidatePath(`/orders/${previous.orderId}`);
  }
  if (matchedOrder?.id) {
    revalidatePath(`/orders/${matchedOrder.id}`);
  }
  redirect("/finance?updated=1");
}
