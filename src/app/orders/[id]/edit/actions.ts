"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createActivityLog } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth";
import { findPhotographerConflict, updateOrder } from "@/lib/order-store";
import type { OrderStatus } from "@/lib/mock-data";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readAmount(formData: FormData, key: string) {
  const value = Number(readText(formData, key));
  return Number.isFinite(value) ? value : 0;
}

export async function updateOrderAction(formData: FormData) {
  const user = await requireSession(["owner", "sales"]);
  const orderId = readText(formData, "orderId");
  const customer = readText(formData, "customer");
  const contact = readText(formData, "contact");
  const school = readText(formData, "school");
  const campus = readText(formData, "campus");
  const className = readText(formData, "className");
  const location = readText(formData, "location");
  const shootDate = readText(formData, "shootDate");
  const packageName = readText(formData, "packageName");
  const amount = readAmount(formData, "amount");
  const status = readText(formData, "status") as OrderStatus;
  const photographer = readText(formData, "photographer");
  const notes = readText(formData, "notes");

  if (
    !orderId ||
    !customer ||
    !contact ||
    !school ||
    !className ||
    !shootDate ||
    !packageName
  ) {
    redirect(`/orders/${orderId}/edit?error=missing`);
  }

  const conflict = await findPhotographerConflict({
    photographer,
    shootDate,
    excludeOrderId: orderId,
  });

  if (conflict) {
    redirect(
      `/orders/${orderId}/edit?error=conflict&photographer=${encodeURIComponent(photographer)}&conflictOrderId=${encodeURIComponent(conflict.id)}`,
    );
  }

  const updated = await updateOrder(orderId, {
    customer,
    contact,
    school,
    campus,
    className,
    location,
    shootDate,
    packageName,
    amount,
    status,
    photographer,
    notes,
  });

  if (!updated) {
    redirect("/orders");
  }

  await createActivityLog({
    action: "update",
    entityType: "order",
    entityId: updated.id,
    entityLabel: updated.customer,
    summary: `更新订单 ${updated.customer}`,
    actor: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}?updated=1`);
}
