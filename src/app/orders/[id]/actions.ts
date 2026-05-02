"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createActivityLog } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth";
import { deleteOrder, getOrderById } from "@/lib/order-store";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function deleteOrderAction(formData: FormData) {
  const user = await requireSession(["owner"]);
  const orderId = readText(formData, "orderId");

  if (!orderId) {
    redirect("/orders");
  }

  const existingOrder = await getOrderById(orderId);

  if (!existingOrder) {
    redirect("/orders");
  }

  if (existingOrder.linkedFinanceCount > 0) {
    redirect(`/orders/${orderId}?error=linked-finance`);
  }

  const deleted = await deleteOrder(orderId);

  if (!deleted) {
    redirect("/orders");
  }

  await createActivityLog({
    action: "delete",
    entityType: "order",
    entityId: deleted.id,
    entityLabel: deleted.customer,
    summary: `删除订单 ${deleted.customer}`,
    actor: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/schedule");
  revalidatePath("/alerts");
  revalidatePath("/delivery");
  redirect("/orders?deleted=1");
}
