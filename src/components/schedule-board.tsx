import Link from "next/link";
import type { OrderWithFinanceSummary } from "@/lib/order-store";
import { statusClassName } from "@/lib/ui";

type ScheduleBoardProps = {
  orders: OrderWithFinanceSummary[];
};

export function ScheduleBoard({ orders }: ScheduleBoardProps) {
  return (
    <div className="space-y-3">
      {orders.length === 0 ? (
        <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line)] bg-white/75 px-4 py-6 text-sm muted">
          当前时间段没有排期，后续新增待拍摄订单后会自动出现在这里。
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
                  {order.school} · {order.campus} · {order.className}
                </p>
                <p className="mt-1 text-sm muted">
                  销售：{order.salesOwner || "未指定"} · 导演：{order.director || "未安排"}
                </p>
              </div>
              <span className={statusClassName[order.status]}>{order.status}</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[color:var(--line)] bg-[#fffdf9] px-3 py-3">
                <p className="text-xs uppercase tracking-[0.16em] muted">拍摄时间</p>
                <p className="mt-2 text-sm font-semibold">{order.shootDate}</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--line)] bg-[#fffdf9] px-3 py-3">
                <p className="text-xs uppercase tracking-[0.16em] muted">地点 / 套餐</p>
                <p className="mt-2 text-sm font-semibold">{order.location || "待补充"}</p>
                <p className="mt-1 text-sm muted">{order.packageName}</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--line)] bg-[#fffdf9] px-3 py-3">
                <p className="text-xs uppercase tracking-[0.16em] muted">人员 / 回款</p>
                <p className="mt-2 text-sm font-semibold">
                  主拍 {order.photographer || "待安排"} / 摄像 {order.leadVideographer || "待安排"}
                </p>
                <p className="mt-1 text-sm muted">
                  辅拍 {order.assistantPhotographer || "待安排"} / 辅摄 {order.assistantVideographer || "待安排"}
                </p>
                <p className="mt-1 text-sm muted">
                  已收 {order.paid} · 待收 ¥{order.outstandingAmount.toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
