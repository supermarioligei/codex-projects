import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { FinanceTable } from "@/components/finance-table";
import { getFinanceEntries } from "@/lib/finance-store";

function parseAmount(value: string) {
  return Number(value.replace(/[^\d.-]/g, "")) || 0;
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const entries = await getFinanceEntries();
  const params = await searchParams;
  const income = entries
    .filter((entry) => entry.type === "收款")
    .reduce((sum, entry) => sum + parseAmount(entry.amount), 0);
  const expense = entries
    .filter((entry) => entry.type !== "收款")
    .reduce((sum, entry) => sum + parseAmount(entry.amount), 0);
  const linkedCount = entries.filter((entry) => entry.orderId).length;
  const summaryCards = [
    {
      label: "累计收款",
      value: `¥${income.toLocaleString("zh-CN")}`,
      detail: "用于跟踪订单回款节奏",
    },
    {
      label: "累计支出退款",
      value: `¥${expense.toLocaleString("zh-CN")}`,
      detail: "包含成本支出与售后退款",
    },
    {
      label: "净流入",
      value: `¥${(income - expense).toLocaleString("zh-CN")}`,
      detail: "收款减去支出退款后的结果",
    },
    {
      label: "已关联合同",
      value: `${linkedCount} 条`,
      detail: "后续可继续扩展为订单账务明细",
    },
  ];

  return (
    <AdminShell
      activeHref="/finance"
      title="账务流水"
      description="记录每一笔收款、退款和支出，并逐步建立与订单的财务关联。"
      aside={
        <>
          <p className="text-sm font-semibold">财务建议</p>
          <p className="mt-2 text-sm leading-6 muted">
            优先把定金、尾款和拍摄成本录全，后面利润分析和催款提醒才会更准确。
          </p>
        </>
      }
    >
      {params.created === "1" ? (
        <section className="rounded-[1.5rem] border border-[#cfe7db] bg-[#f2fbf6] px-5 py-4 text-sm text-[#25644d]">
          流水已保存，账务列表和首页收支区域已经同步更新。
        </section>
      ) : null}
      {params.updated === "1" ? (
        <section className="rounded-[1.5rem] border border-[#cfe7db] bg-[#f2fbf6] px-5 py-4 text-sm text-[#25644d]">
          流水信息已更新，相关订单的实收汇总也已同步刷新。
        </section>
      ) : null}

      <div className="flex flex-col gap-4 rounded-[2rem] bg-[linear-gradient(135deg,#eef7f4_0%,#fffdfa_55%,#fff2e8_100%)] px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] muted">Finance</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            流水总览与核对
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 muted">
            这一页后面可以继续加时间筛选、按订单汇总、摄影师成本分摊和月度利润统计。
          </p>
        </div>
        <Link
          href="/finance/new"
          className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105"
        >
          登记流水
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className="soft-card rounded-[1.5rem] p-5">
            <p className="text-sm muted">{card.label}</p>
            <h3 className="mt-4 text-3xl font-semibold">{card.value}</h3>
            <p className="mt-3 text-sm leading-6 muted">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="soft-card rounded-[1.75rem] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold">全部流水</p>
            <p className="mt-1 text-sm muted">
              已支持和订单关联。下一步我们可以继续做按订单自动汇总实收与未收。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm">
              <p className="muted">流水总条数</p>
              <p className="mt-1 font-medium">{entries.length} 条</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm">
              <p className="muted">收款条数</p>
              <p className="mt-1 font-medium">
                {entries.filter((entry) => entry.type === "收款").length} 条
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm">
              <p className="muted">已关联订单</p>
              <p className="mt-1 font-medium">{linkedCount} 条</p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <FinanceTable entries={entries} />
        </div>
      </section>
    </AdminShell>
  );
}
