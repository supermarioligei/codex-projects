import type { FinanceEntry } from "@/lib/mock-data";
import type { OrderWithFinanceSummary } from "@/lib/order-store";
import type { GeneratedReminder } from "@/lib/reminders";

function parseCurrency(value: string) {
  return Number(value.replace(/[^\d.-]/g, "")) || 0;
}

function toDate(value: string) {
  return new Date(value.replace(" ", "T"));
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function endOfWeek(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  next.setDate(next.getDate() + 6);
  return next;
}

export function buildDashboardMetrics(
  orders: OrderWithFinanceSummary[],
  financeEntries: FinanceEntry[],
  reminders: GeneratedReminder[],
  now = new Date(),
) {
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekEnd = endOfWeek(now);

  const monthlyOrders = orders.filter((order) => {
    const shootAt = toDate(order.shootDate);
    return shootAt >= monthStart && shootAt <= monthEnd;
  });

  const monthlySignedAmount = monthlyOrders.reduce(
    (sum, order) => sum + parseCurrency(order.amount),
    0,
  );
  const monthlyReceivedAmount = financeEntries
    .filter((entry) => entry.type === "收款")
    .reduce((sum, entry) => sum + parseCurrency(entry.amount), 0);
  const monthlyRefundAmount = financeEntries
    .filter((entry) => entry.type === "退款")
    .reduce((sum, entry) => sum + parseCurrency(entry.amount), 0);
  const monthlyCostAmount = financeEntries
    .filter((entry) => entry.type === "支出")
    .reduce((sum, entry) => sum + parseCurrency(entry.amount), 0);

  const weeklyShoots = orders.filter((order) => {
    const shootAt = toDate(order.shootDate);
    return shootAt >= now && shootAt <= weekEnd && order.status === "待拍摄";
  });

  const deliveryActive = orders.filter(
    (order) => order.status === "待选片" || order.status === "待交付",
  );
  const highRiskOrders = orders
    .filter(
      (order) =>
        order.outstandingAmount > 0 &&
        (order.status === "待交付" ||
          order.status === "待拍摄" ||
          order.status === "待选片"),
    )
    .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
    .slice(0, 4);

  return {
    monthlySignedAmount,
    monthlyReceivedAmount,
    monthlyRefundAmount,
    monthlyCostAmount,
    weeklyShoots,
    deliveryActive,
    highRiskOrders,
    reminderBreakdown: {
      shoot: reminders.filter((item) => item.category === "拍摄提醒").length,
      finance: reminders.filter((item) => item.category === "财务提醒").length,
      delivery: reminders.filter((item) => item.category === "交付提醒").length,
    },
  };
}
