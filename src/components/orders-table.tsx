import Link from "next/link";
import type { OrderWithFinanceSummary } from "@/lib/order-store";
import { statusClassName } from "@/lib/ui";

type OrdersTableProps = {
  orders: OrderWithFinanceSummary[];
  emptyText?: string;
};

export function OrdersTable({
  orders,
  emptyText = "当前没有可显示的订单。",
}: OrdersTableProps) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[color:var(--line)]">
      <div className="hidden grid-cols-[1.2fr_1fr_1fr_0.8fr_0.7fr] gap-3 bg-[#f6efe6] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#6e7066] md:grid">
        <span>客户 / 班级</span>
        <span>拍摄时间</span>
        <span>套餐 / 地点</span>
        <span>金额</span>
        <span>状态</span>
      </div>
      <div className="divide-y divide-[color:var(--line)] bg-white/70">
        {orders.length === 0 ? (
          <div className="px-5 py-8 text-sm muted">{emptyText}</div>
        ) : (
          orders.map((order) => (
          <div
            key={order.id}
            className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_1fr_0.8fr_0.7fr] md:items-center"
          >
            <div>
              <Link
                href={`/orders/${order.id}`}
                className="font-semibold transition hover:text-[color:var(--accent)]"
              >
                {order.customer}
              </Link>
              <p className="mt-1 text-sm muted">
                {order.school} · {order.className}
              </p>
              <p className="mt-1 text-sm muted">
                {order.contact} · {order.id}
              </p>
            </div>
            <div className="text-sm leading-6">
              <p>{order.shootDate}</p>
              <p className="muted">{order.campus}</p>
            </div>
            <div className="text-sm leading-6">
              <p>{order.packageName}</p>
              <p className="muted">{order.location}</p>
            </div>
            <div className="text-sm leading-6">
              <p className="font-semibold">{order.amount}</p>
              <p className="muted">
                已收 {order.paid} · 待收 ¥
                {order.outstandingAmount.toLocaleString("zh-CN")}
              </p>
            </div>
            <div>
              <span className={statusClassName[order.status]}>{order.status}</span>
              <div className="mt-2">
                <Link
                  href={`/orders/${order.id}`}
                  className="text-sm font-medium text-[color:var(--accent)]"
                >
                  查看详情
                </Link>
              </div>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
}
