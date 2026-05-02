import type { FinanceEntry } from "@/lib/mock-data";
import type { OrderWithFinanceSummary } from "@/lib/order-store";
import type { GeneratedReminder } from "@/lib/reminders";

export type ReceiptCalendarCell = {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  receivedAmount: number;
};

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

function startOfCalendarMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfCalendarMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function toFinanceDate(value: string) {
  if (!value) {
    return null;
  }

  const normalized = value.replace("T", " ").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return new Date(`${normalized}T00:00:00`);
  }

  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(normalized)) {
    return new Date(normalized.replace(" ", "T"));
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function buildReceiptCalendar(financeEntries: FinanceEntry[], now = new Date()) {
  const monthStart = startOfCalendarMonth(now);
  const monthEnd = endOfCalendarMonth(now);
  const leadingOffset = (monthStart.getDay() + 6) % 7;
  const firstCellDate = new Date(monthStart);
  firstCellDate.setDate(monthStart.getDate() - leadingOffset);

  const trailingOffset = 6 - ((monthEnd.getDay() + 6) % 7);
  const lastCellDate = new Date(monthEnd);
  lastCellDate.setDate(monthEnd.getDate() + trailingOffset);

  const dailyReceivedMap = financeEntries.reduce<Map<string, number>>((map, entry) => {
    if (entry.type !== "收款") {
      return map;
    }

    const entryAt = toFinanceDate(entry.time);

    if (!entryAt) {
      return map;
    }

    const dateKey = toDateKey(entryAt);
    const current = map.get(dateKey) ?? 0;
    map.set(dateKey, current + parseCurrency(entry.amount));
    return map;
  }, new Map());

  const cells: ReceiptCalendarCell[] = [];

  for (
    const cursor = new Date(firstCellDate);
    cursor <= lastCellDate;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const current = new Date(cursor);
    const dateKey = toDateKey(current);

    cells.push({
      date: dateKey,
      day: current.getDate(),
      isCurrentMonth: current.getMonth() === now.getMonth(),
      receivedAmount: dailyReceivedMap.get(dateKey) ?? 0,
    });
  }

  const monthReceivedTotal = cells
    .filter((cell) => cell.isCurrentMonth)
    .reduce((sum, cell) => sum + cell.receivedAmount, 0);
  const maxDailyReceived = cells
    .filter((cell) => cell.isCurrentMonth)
    .reduce((max, cell) => Math.max(max, cell.receivedAmount), 0);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    title: `${now.getFullYear()} 年 ${now.getMonth() + 1} 月入账日历`,
    monthKey: toDateKey(monthStart).slice(0, 7),
    previousMonthKey: toDateKey(previousMonth).slice(0, 7),
    nextMonthKey: toDateKey(nextMonth).slice(0, 7),
    monthReceivedTotal,
    maxDailyReceived,
    cells,
  };
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
