"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createActivityLog } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth";
import {
  findPhotographerConflict,
  getClothingUsageCount,
  getOrderById,
  updateOrder,
} from "@/lib/order-store";
import type { OrderStatus, ShootPeriod } from "@/lib/mock-data";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readAmount(formData: FormData, key: string) {
  const value = Number(readText(formData, key));
  return Number.isFinite(value) ? value : 0;
}

function readShootPeriod(formData: FormData, key: string): ShootPeriod {
  return readText(formData, key) === "下午" ? "下午" : "上午";
}

export async function updateOrderAction(formData: FormData) {
  const user = await requireSession([
    "owner",
    "sales",
    "production_manager",
    "delivery_manager",
  ]);
  const orderId = readText(formData, "orderId");
  const customer = readText(formData, "customer");
  const contact = readText(formData, "contact");
  const school = readText(formData, "school");
  const campus = readText(formData, "campus");
  const signingClerk = readText(formData, "signingClerk");
  const peopleCount = readText(formData, "peopleCount");
  const location = readText(formData, "location");
  const shootDate = readText(formData, "shootDate");
  const shootPeriod = readShootPeriod(formData, "shootPeriod");
  const clothingType = readText(formData, "clothingType");
  const packageName = readText(formData, "packageName");
  const amount = readAmount(formData, "amount");
  const status = readText(formData, "status") as OrderStatus;
  const salesOwner = readText(formData, "salesOwner");
  const director = readText(formData, "director");
  const photographer = readText(formData, "photographer");
  const assistantPhotographer = readText(formData, "assistantPhotographer");
  const leadVideographer = readText(formData, "leadVideographer");
  const assistantVideographer = readText(formData, "assistantVideographer");
  const deliveryDueDate = readText(formData, "deliveryDueDate");
  const notes = readText(formData, "notes");
  const existingOrder = orderId ? await getOrderById(orderId) : null;

  if (
    !orderId ||
    !customer ||
    !contact ||
    !school ||
    !shootDate ||
    !packageName
  ) {
    redirect(`/orders/${orderId}/edit?error=missing`);
  }

  if (!existingOrder) {
    redirect("/orders");
  }

  const nextDirector = user.role === "sales" ? existingOrder.director ?? "" : director;
  const nextPhotographer =
    user.role === "sales" ? existingOrder.photographer ?? "" : photographer;
  const nextAssistantPhotographer =
    user.role === "sales"
      ? existingOrder.assistantPhotographer ?? ""
      : assistantPhotographer;
  const nextLeadVideographer =
    user.role === "sales" ? existingOrder.leadVideographer ?? "" : leadVideographer;
  const nextAssistantVideographer =
    user.role === "sales"
      ? existingOrder.assistantVideographer ?? ""
      : assistantVideographer;

  const conflict = await findPhotographerConflict({
    photographer: nextPhotographer,
    shootDate,
    shootPeriod,
    excludeOrderId: orderId,
  });

  if (conflict) {
    redirect(
      `/orders/${orderId}/edit?error=conflict&photographer=${encodeURIComponent(photographer)}&conflictOrderId=${encodeURIComponent(conflict.id)}`,
    );
  }

  const clothingUsageCount = await getClothingUsageCount({
    clothingType,
    shootDate,
    excludeOrderId: orderId,
  });

  if (clothingType && clothingUsageCount >= 3) {
    redirect(
      `/orders/${orderId}/edit?error=clothing-limit&clothingType=${encodeURIComponent(clothingType)}`,
    );
  }

  const updated = await updateOrder(orderId, {
    customer,
    contact,
    school,
    campus,
    className: existingOrder.className ?? "",
    signingClerk,
    location,
    shootDate,
    shootPeriod,
    peopleCount,
    clothingType,
    packageName,
    amount,
    status,
    salesOwner,
    director: nextDirector,
    photographer: nextPhotographer,
    assistantPhotographer: nextAssistantPhotographer,
    leadVideographer: nextLeadVideographer,
    assistantVideographer: nextAssistantVideographer,
    deliveryDueDate,
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
