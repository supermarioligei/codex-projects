import type { FinanceEntry } from "@/lib/mock-data";
import type { OrderWithFinanceSummary } from "@/lib/order-store";

export type ReminderCategory = "拍摄提醒" | "财务提醒" | "交付提醒";
export type ReminderPriority = "高优先级" | "中优先级" | "常规";

export type GeneratedReminder = {
  id: string;
  title: string;
  detail: string;
  level: ReminderPriority;
  category: ReminderCategory;
  href: string;
  orderId?: string;
};

function toDate(value: string) {
  return new Date(value.replace(" ", "T"));
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function hasFinalPayment(entries: FinanceEntry[], orderId: string) {
  return entries.some(
    (entry) =>
      entry.orderId === orderId &&
      entry.type === "收款" &&
      (entry.category === "订单尾款" || entry.category === "订单全款"),
  );
}

export function generateReminders(
  orders: OrderWithFinanceSummary[],
  financeEntries: FinanceEntry[],
  now = new Date(),
) {
  const todayStart = startOfDay(now);
  const tomorrowStart = startOfDay(addDays(now, 1));
  const tomorrowEnd = endOfDay(addDays(now, 1));

  const reminders: GeneratedReminder[] = [];

  for (const order of orders) {
    const shootAt = toDate(order.shootDate);

    if (
      order.status === "待拍摄" &&
      shootAt >= todayStart &&
      shootAt <= tomorrowEnd
    ) {
      const isTomorrow = shootAt >= tomorrowStart && shootAt <= tomorrowEnd;
      reminders.push({
        id: `shoot-${order.id}`,
        title: `${isTomorrow ? "明天拍摄" : "今天拍摄"}：${order.customer}`,
        detail: `${order.shootDate} · ${order.location || "地点待补充"} · ${
          order.photographer || "待安排摄影师"
        }`,
        level: "高优先级",
        category: "拍摄提醒",
        href: `/orders/${order.id}`,
        orderId: order.id,
      });
    }

    if (order.status === "待拍摄" && !order.photographer?.trim()) {
      reminders.push({
        id: `crew-${order.id}`,
        title: `待安排摄影师：${order.customer}`,
        detail: `${order.shootDate} 开拍，当前尚未分配摄影师，请尽快确认人员和出行安排。`,
        level: "中优先级",
        category: "拍摄提醒",
        href: `/orders/${order.id}/edit`,
        orderId: order.id,
      });
    }

    if (order.outstandingAmount > 0 && shootAt <= endOfDay(addDays(now, 7))) {
      reminders.push({
        id: `payment-${order.id}`,
        title: `待跟进尾款：${order.customer}`,
        detail: `当前还待收 ¥${order.outstandingAmount.toLocaleString(
          "zh-CN",
        )}，建议在拍摄前或交付前确认回款节点。`,
        level: order.outstandingAmount >= 5000 ? "高优先级" : "中优先级",
        category: "财务提醒",
        href: `/orders/${order.id}`,
        orderId: order.id,
      });
    }

    if (
      (order.status === "待选片" || order.status === "待交付") &&
      !hasFinalPayment(financeEntries, order.id)
    ) {
      reminders.push({
        id: `delivery-${order.id}`,
        title: `交付前确认尾款：${order.customer}`,
        detail: `订单当前状态为${order.status}，但还没有登记尾款或全款收讫记录。`,
        level: "中优先级",
        category: "交付提醒",
        href: `/finance/new`,
        orderId: order.id,
      });
    }
  }

  return reminders.sort((a, b) => {
    const categoryOrder: Record<ReminderCategory, number> = {
      拍摄提醒: 0,
      财务提醒: 1,
      交付提醒: 2,
    };
    const levelOrder: Record<ReminderPriority, number> = {
      高优先级: 0,
      中优先级: 1,
      常规: 2,
    };

    return (
      categoryOrder[a.category] - categoryOrder[b.category] ||
      levelOrder[a.level] - levelOrder[b.level]
    );
  });
}

export function filterRemindersForPhotographer(reminders: GeneratedReminder[]) {
  return reminders
    .filter((item) => item.category !== "财务提醒")
    .map((item) =>
      item.category === "交付提醒" && item.orderId
        ? { ...item, href: `/orders/${item.orderId}` }
        : item,
    );
}
