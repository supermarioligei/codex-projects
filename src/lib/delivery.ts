import type { OrderWithFinanceSummary } from "@/lib/order-store";

export function buildDeliveryBuckets(orders: OrderWithFinanceSummary[]) {
  const selectable = orders
    .filter((order) => order.status === "待选片")
    .sort((a, b) => a.shootDate.localeCompare(b.shootDate));
  const deliverable = orders
    .filter((order) => order.status === "待交付")
    .sort((a, b) => a.shootDate.localeCompare(b.shootDate));
  const completed = orders
    .filter((order) => order.status === "已完成")
    .sort((a, b) => b.shootDate.localeCompare(a.shootDate));

  return {
    selectable,
    deliverable,
    completed,
    active: [...selectable, ...deliverable].sort((a, b) =>
      a.shootDate.localeCompare(b.shootDate),
    ),
  };
}
