"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createActivityLog } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth";
import { createFinanceEntry } from "@/lib/finance-store";
import { createOrder, findPhotographerConflict, getClothingUsageCount } from "@/lib/order-store";
import type { OrderStatus, ShootPeriod } from "@/lib/mock-data";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readAmount(formData: FormData, key: string) {
  const value = Number(readText(formData, key));
  return Number.isFinite(value) ? value : 0;
}

function readPaymentRows(formData: FormData) {
  const amounts = formData.getAll("initialPayments");
  const dates = formData.getAll("initialPaymentDates");

  return amounts
    .map((amountValue, index) => ({
      amountText: String(amountValue ?? "").trim(),
      date: String(dates[index] ?? "").trim(),
    }))
    .filter((item) => item.amountText || item.date)
    .map((item) => ({
      amount: Number(item.amountText),
      date: item.date,
    }));
}

function readShootPeriod(formData: FormData, key: string): ShootPeriod {
  return readText(formData, key) === "下午" ? "下午" : "上午";
}

export async function createOrderAction(formData: FormData) {
  const user = await requireSession(["owner", "sales"]);
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
  const paymentRows = readPaymentRows(formData);
  const invalidPaymentRow = paymentRows.some(
    (item) => !Number.isFinite(item.amount) || item.amount <= 0 || !item.date,
  );
  const paid = paymentRows.reduce((sum, item) => sum + item.amount, 0);
  const status = readText(formData, "status") as OrderStatus;
  const salesOwner = user.role === "sales" ? user.name : readText(formData, "salesOwner");
  const director = user.role === "sales" ? "" : readText(formData, "director");
  const photographer = user.role === "sales" ? "" : readText(formData, "photographer");
  const assistantPhotographer =
    user.role === "sales" ? "" : readText(formData, "assistantPhotographer");
  const leadVideographer =
    user.role === "sales" ? "" : readText(formData, "leadVideographer");
  const assistantVideographer =
    user.role === "sales" ? "" : readText(formData, "assistantVideographer");
  const deliveryDueDate = readText(formData, "deliveryDueDate");
  const notes = readText(formData, "notes");

  if (
    !customer ||
    !contact ||
    !school ||
    !shootDate ||
    !packageName ||
    invalidPaymentRow
  ) {
    redirect("/orders/new?error=missing");
  }

  const conflict = await findPhotographerConflict({
    photographer,
    shootDate,
    shootPeriod,
  });

  if (conflict) {
    redirect(
      `/orders/new?error=conflict&photographer=${encodeURIComponent(photographer)}&conflictOrderId=${encodeURIComponent(conflict.id)}`,
    );
  }

  const clothingUsageCount = await getClothingUsageCount({
    clothingType,
    shootDate,
  });

  if (clothingType && clothingUsageCount >= 3) {
    redirect(`/orders/new?error=clothing-limit&clothingType=${encodeURIComponent(clothingType)}`);
  }

  const order = await createOrder({
    customer,
    contact,
    school,
    campus,
    className: "",
    signingClerk,
    location,
    shootDate,
    shootPeriod,
    peopleCount,
    clothingType,
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
    for (const [index, payment] of paymentRows.entries()) {
      const title = `${customer}第${index + 1}笔收款`;
      await createFinanceEntry({
        type: "收款",
        title,
        amount: payment.amount,
        happenedAt: payment.date,
        orderId: order.id,
        orderLabel: order.customer,
        category: "订单收款",
        counterparty: contact,
        notes: "创建订单时自动登记的已收款项",
      });

      await createActivityLog({
        action: "create",
        entityType: "finance",
        entityId: order.id,
        entityLabel: title,
        summary: `创建订单时自动登记收款 ${title}`,
        actor: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
        },
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/finance");
  redirect("/orders?created=1");
}
