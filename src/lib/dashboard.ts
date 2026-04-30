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

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
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
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const weekEnd = endOfWeek(now);
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  const monthlyOrders = orders.filter((order) => {
    const shootAt = toDate(order.shootDate);
    return shootAt >= monthStart && shootAt <= monthEnd;
  });

  const monthlySignedAmount = monthlyOrders.reduce(
    (sum, order) => sum + parseCurrency(order.amount),
    0,
  );
  const monthlyReceivedAmount = financeEntries
    .filter((entry) => {
      if (entry.type !== "收款") {
        return false;
      }

      const entryAt = toDate(entry.time);
      return entryAt >= monthStart && entryAt <= monthEnd;
    })
    .reduce((sum, entry) => sum + parseCurrency(entry.amount), 0);
  const monthlyRefundAmount = financeEntries
    .filter((entry) => {
      if (entry.type !== "退款") {
        return false;
      }

      const entryAt = toDate(entry.time);
      return entryAt >= monthStart && entryAt <= monthEnd;
    })
    .reduce((sum, entry) => sum + parseCurrency(entry.amount), 0);
  const monthlyCostAmount = financeEntries
    .filter((entry) => {
      if (entry.type !== "支出") {
        return false;
      }

      const entryAt = toDate(entry.time);
      return entryAt >= monthStart && entryAt <= monthEnd;
    })
    .reduce((sum, entry) => sum + parseCurrency(entry.amount), 0);
  const dailyReceivedAmount = financeEntries
    .filter((entry) => {
      if (entry.type !== "收款") {
        return false;
      }

      const entryAt = toDate(entry.time);
      return entryAt >= dayStart && entryAt <= dayEnd;
    })
    .reduce((sum, entry) => sum + parseCurrency(entry.amount), 0);
  const yearlyReceivedAmount = financeEntries
    .filter((entry) => {
      if (entry.type !== "收款") {
        return false;
      }

      const entryAt = toDate(entry.time);
      return entryAt >= yearStart && entryAt <= yearEnd;
    })
    .reduce((sum, entry) => sum + parseCurrency(entry.amount), 0);
  const yearlyRefundAmount = financeEntries
    .filter((entry) => {
      if (entry.type !== "退款") {
        return false;
      }

      const entryAt = toDate(entry.time);
      return entryAt >= yearStart && entryAt <= yearEnd;
    })
    .reduce((sum, entry) => sum + parseCurrency(entry.amount), 0);
  const yearlyCostAmount = financeEntries
    .filter((entry) => {
      if (entry.type !== "支出") {
        return false;
      }

      const entryAt = toDate(entry.time);
      return entryAt >= yearStart && entryAt <= yearEnd;
    })
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
    dailyReceivedAmount,
    monthlyReceivedAmount,
    monthlyRefundAmount,
    monthlyCostAmount,
    yearlyReceivedAmount,
    yearlyRefundAmount,
    yearlyCostAmount,
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
