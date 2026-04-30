import Link from "next/link";
import type { FinanceEntry } from "@/lib/mock-data";
import type { OrderWithFinanceSummary } from "@/lib/order-store";

type FinanceTableProps = {
  entries: FinanceEntry[];
  ordersById?: Record<string, OrderWithFinanceSummary>;
};

export function FinanceTable({ entries, ordersById = {} }: FinanceTableProps) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[color:var(--line)]">
      <div className="hidden grid-cols-[0.8fr_1.2fr_0.9fr_0.8fr_0.9fr] gap-3 bg-[#f6efe6] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#6e7066] md:grid">
        <span>类型</span>
        <span>摘要 / 关联订单</span>
        <span>分类 / 对方</span>
        <span>金额</span>
        <span>时间</span>
      </div>
      <div className="divide-y divide-[color:var(--line)] bg-white/70">
        {entries.map((entry) => (
          (() => {
            const linkedOrder = entry.orderId ? ordersById[entry.orderId] : undefined;

            return (
          <div
            key={entry.id}
            className="grid gap-3 px-5 py-4 md:grid-cols-[0.8fr_1.2fr_0.9fr_0.8fr_0.9fr] md:items-center"
          >
            <div>
              <span
                className={`status-pill ${
                  entry.type === "收款"
                    ? "status-done"
                    : entry.type === "退款"
                      ? "status-delivery"
                      : "status-waiting"
                }`}
              >
                {entry.type}
              </span>
            </div>
            <div>
              <Link
                href={`/finance/${entry.id}/edit`}
                className="font-semibold transition hover:text-[color:var(--accent)]"
              >
                {entry.title}
              </Link>
              <p className="mt-1 text-sm muted">
                {entry.orderLabel ? `关联订单：${entry.orderLabel}` : "未关联订单"}
              </p>
              {linkedOrder ? (
                <p className="mt-1 text-sm muted">
                  销售：{linkedOrder.salesOwner || "未指定"} · 主拍：{linkedOrder.photographer || "未安排"}
                </p>
              ) : null}
            </div>
            <div className="text-sm leading-6">
              <p>{entry.category || "未分类"}</p>
              <p className="muted">{entry.counterparty || "未填写往来方"}</p>
            </div>
            <div>
              <p
                className={`font-semibold ${
                  entry.amount.startsWith("+")
                    ? "text-[color:var(--success)]"
                    : "text-[#bc5f4a]"
                }`}
              >
                {entry.amount}
              </p>
            </div>
            <div className="text-sm muted">{entry.time}</div>
          </div>
            );
          })()
        ))}
      </div>
    </div>
  );
}
