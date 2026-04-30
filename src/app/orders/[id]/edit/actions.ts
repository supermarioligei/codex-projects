"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateOrder } from "@/lib/order-store";
import type { OrderStatus } from "@/lib/mock-data";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readAmount(formData: FormData, key: string) {
  const value = Number(readText(formData, key));
  return Number.isFinite(value) ? value : 0;
}

export async function updateOrderAction(formData: FormData) {
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

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}?updated=1`);
}
