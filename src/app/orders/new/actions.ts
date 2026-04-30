"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const photographer = readText(formData, "photographer");
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
    photographer,
    notes,
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
  }

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/finance");
  redirect("/orders?created=1");
}
