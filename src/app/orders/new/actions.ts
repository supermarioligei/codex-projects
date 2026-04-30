"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createActivityLog } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth";
import { createFinanceEntry } from "@/lib/finance-store";
import { createOrder, findPhotographerConflict } from "@/lib/order-store";
import type { OrderStatus } from "@/lib/mock-data";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readAmount(formData: FormData, key: string) {
  const value = Number(readText(formData, key));
  return Number.isFinite(value) ? value : 0;
}

export async function createOrderAction(formData: FormData) {
  const user = await requireSession(["owner", "sales"]);
  const customer = readText(formData, "customer");
  const contact = readText(formData, "contact");
  const school = readText(formData, "school");
  const campus = readText(formData, "campus");
  const className = readText(formData, "className");
  const location = readText(formData, "location");
  const shootDate = readText(formData, "shootDate");
  const packageName = readText(formData, "packageName");
  const amount = readAmount(formData, "amount");
  const paid = readAmount(formData, "paid");
  const status = readText(formData, "status") as OrderStatus;
  const salesOwner = readText(formData, "salesOwner");
  const director = readText(formData, "director");
  const photographer = readText(formData, "photographer");
  const assistantPhotographer = readText(formData, "assistantPhotographer");
  const leadVideographer = readText(formData, "leadVideographer");
  const assistantVideographer = readText(formData, "assistantVideographer");
  const deliveryDueDate = readText(formData, "deliveryDueDate");
  const notes = readText(formData, "notes");

  if (
    !customer ||
    !contact ||
    !school ||
    !className ||
    !shootDate ||
    !packageName
  ) {
    redirect("/orders/new?error=missing");
  }

  const conflict = await findPhotographerConflict({
    photographer,
    shootDate,
  });

  if (conflict) {
    redirect(
      `/orders/new?error=conflict&photographer=${encodeURIComponent(photographer)}&conflictOrderId=${encodeURIComponent(conflict.id)}`,
    );
  }

  const order = await createOrder({
    customer,
    contact,
    school,
    campus,
    className,
    location,
    shootDate,
    packageName,
    amount,
    paid,
    status,
    salesOwner,
    director,
    photographer,
    assistantPhotographer,
    leadVideographer,
    assistantVideographer,
    deliveryDueDate,
    notes,
  });

  await createActivityLog({
    action: "create",
    entityType: "order",
    entityId: order.id,
    entityLabel: order.customer,
    summary: `创建订单 ${order.customer}`,
    actor: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });

  if (paid > 0) {
    await createFinanceEntry({
      type: "收款",
      title: `${customer}定金`,
      amount: paid,
      happenedAt: "",
      orderId: order.id,
      orderLabel: order.customer,
      category: "订单定金",
      counterparty: contact,
      notes: "创建订单时自动登记的首笔收款",
    });

    await createActivityLog({
      action: "create",
      entityType: "finance",
      entityId: order.id,
      entityLabel: `${order.customer}定金`,
      summary: `创建订单时自动登记收款 ${order.customer}定金`,
      actor: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/finance");
  redirect("/orders?created=1");
}
