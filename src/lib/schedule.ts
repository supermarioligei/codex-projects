import type { OrderWithFinanceSummary } from "@/lib/order-store";

type ScheduleBucket = {
  today: OrderWithFinanceSummary[];
  tomorrow: OrderWithFinanceSummary[];
  thisWeek: OrderWithFinanceSummary[];
  upcoming: OrderWithFinanceSummary[];
  unassigned: OrderWithFinanceSummary[];
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

export function buildScheduleBuckets(
  orders: OrderWithFinanceSummary[],
  now = new Date(),
): ScheduleBucket {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowStart = startOfDay(addDays(now, 1));
  const tomorrowEnd = endOfDay(addDays(now, 1));
  const weekEnd = endOfDay(addDays(now, 6));

  const upcoming = orders
    .filter((order) => {
      const shootAt = toDate(order.shootDate);
      return shootAt >= todayStart;
    })
    .sort((a, b) => a.shootDate.localeCompare(b.shootDate));

  return {
    today: upcoming.filter((order) => {
      const shootAt = toDate(order.shootDate);
      return shootAt >= todayStart && shootAt <= todayEnd;
    }),
    tomorrow: upcoming.filter((order) => {
      const shootAt = toDate(order.shootDate);
      return shootAt >= tomorrowStart && shootAt <= tomorrowEnd;
    }),
    thisWeek: upcoming.filter((order) => {
      const shootAt = toDate(order.shootDate);
      return shootAt >= todayStart && shootAt <= weekEnd;
    }),
    upcoming,
    unassigned: upcoming.filter((order) => !order.photographer?.trim()),
  };
}
