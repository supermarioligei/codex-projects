import Link from "next/link";
import type { OrderWithFinanceSummary } from "@/lib/order-store";
import { statusClassName } from "@/lib/ui";

type DeliveryBoardProps = {
  orders: OrderWithFinanceSummary[];
  emptyText: string;
};

export function DeliveryBoard({ orders, emptyText }: DeliveryBoardProps) {
  return (
    <div className="space-y-3">
      {orders.length === 0 ? (
        <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line)] bg-white/75 px-4 py-6 text-sm muted">
          {emptyText}
        </div>
      ) : (
        orders.map((order) => (
          <article
            key={order.id}
            className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/orders/${order.id}`}
                  className="text-base font-semibold transition hover:text-[color:var(--accent)]"
                >
                  {order.customer}
                </Link>
                <p className="mt-1 text-sm muted">
                  {order.school} · {order.className} · {order.shootDate}
                </p>
                <p className="mt-1 text-sm muted">
                  销售：{order.salesOwner || "未指定"} · 导演：{order.director || "未安排"}
                </p>
              </div>
              <span className={statusClassName[order.status]}>{order.status}</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[color:var(--line)] bg-[#fffdf9] px-3 py-3">
                <p className="text-xs uppercase tracking-[0.16em] muted">交付进度</p>
                <p className="mt-2 text-sm font-semibold">{order.packageName}</p>
                <p className="mt-1 text-sm muted">
                  {order.location || "地点已完成拍摄"} · 截止 {order.deliveryDueDate || "待补充"}
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--line)] bg-[#fffdf9] px-3 py-3">
                <p className="text-xs uppercase tracking-[0.16em] muted">回款状态</p>
                <p className="mt-2 text-sm font-semibold">已收 {order.paid}</p>
                <p className="mt-1 text-sm muted">
                  待收 ¥{order.outstandingAmount.toLocaleString("zh-CN")}
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--line)] bg-[#fffdf9] px-3 py-3">
                <p className="text-xs uppercase tracking-[0.16em] muted">操作建议</p>
                <p className="mt-2 text-sm font-semibold">
                  {order.outstandingAmount > 0 ? "先确认尾款" : "可推进交付"}
                </p>
                <p className="mt-1 text-sm muted">
                  主拍 {order.photographer || "待补充"} · 摄像 {order.leadVideographer || "待补充"}
                </p>
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
