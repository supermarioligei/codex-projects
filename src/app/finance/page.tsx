import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { FinanceTable } from "@/components/finance-table";
import { requireSession } from "@/lib/auth";
import { getFinanceEntries } from "@/lib/finance-store";
import { getOrders } from "@/lib/order-store";

function parseAmount(value: string) {
  return Number(value.replace(/[^\d.-]/g, "")) || 0;
}

function toDate(value: string) {
  return new Date(value.replace(" ", "T"));
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; period?: string }>;
}) {
  await requireSession(["owner", "finance_director"]);
  const [entries, orders] = await Promise.all([getFinanceEntries(), getOrders()]);
  const params = await searchParams;
  const ordersById = Object.fromEntries(orders.map((order) => [order.id, order]));
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  const selectedPeriod = ["day", "month", "year", "all"].includes(params.period ?? "")
    ? (params.period as "day" | "month" | "year" | "all")
    : "all";
  const filteredEntries = entries.filter((entry) => {
    const entryAt = toDate(entry.time);

    if (selectedPeriod === "day") {
      return entryAt >= todayStart && entryAt <= todayEnd;
    }

    if (selectedPeriod === "month") {
      return entryAt >= monthStart && entryAt <= monthEnd;
    }

    if (selectedPeriod === "year") {
      return entryAt >= yearStart && entryAt <= yearEnd;
    }

    return true;
  });
  const linkedCount = entries.filter((entry) => entry.orderId).length;
  const todayIncome = entries
    .filter((entry) => {
      if (entry.type !== "收款") {
        return false;
      }

      const entryAt = toDate(entry.time);
      return entryAt >= todayStart && entryAt <= todayEnd;
    })
    .reduce((sum, entry) => sum + parseAmount(entry.amount), 0);
  const monthIncome = entries
    .filter((entry) => {
      if (entry.type !== "收款") {
        return false;
      }

      const entryAt = toDate(entry.time);
      return entryAt >= monthStart && entryAt <= monthEnd;
    })
    .reduce((sum, entry) => sum + parseAmount(entry.amount), 0);
  const yearIncome = entries
    .filter((entry) => {
      if (entry.type !== "收款") {
        return false;
      }

      const entryAt = toDate(entry.time);
      return entryAt >= yearStart && entryAt <= yearEnd;
    })
    .reduce((sum, entry) => sum + parseAmount(entry.amount), 0);
  const yearExpense = entries
    .filter((entry) => {
      if (entry.type === "收款") {
        return false;
      }

      const entryAt = toDate(entry.time);
      return entryAt >= yearStart && entryAt <= yearEnd;
    })
    .reduce((sum, entry) => sum + parseAmount(entry.amount), 0);
  const outstandingAmount = orders.reduce((sum, order) => sum + order.outstandingAmount, 0);
  const attributedOrders = orders.filter((order) => order.salesOwner || order.photographer).length;
  const summaryCards = [
    {
      label: "当日收款",
      value: `¥${todayIncome.toLocaleString("zh-CN")}`,
      detail: "今天已登记的全部收款",
    },
    {
      label: "本月收款",
      value: `¥${monthIncome.toLocaleString("zh-CN")}`,
      detail: "用于跟踪当月回款节奏",
    },
    {
      label: "全年净流入",
      value: `¥${(yearIncome - yearExpense).toLocaleString("zh-CN")}`,
      detail: "本年收款减去退款和支出",
    },
    {
      label: "订单待收总额",
      value: `¥${outstandingAmount.toLocaleString("zh-CN")}`,
      detail: "方便财务总监优先盯大额未回款订单",
    },
    {
      label: "归属已补订单",
      value: `${attributedOrders} 单`,
      detail: `${linkedCount} 条流水已关联订单，可继续扩展为利润分析`,
    },
  ];
  const periodLabels = {
    day: "今天",
    month: "本月",
    year: "本年",
    all: "全部",
  } as const;

  return (
    <AdminShell
      activeHref="/finance"
      title="账务流水"
      description="记录每一笔收款、退款和支出，并核对每一笔订单归属的销售和拍摄执行团队。"
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
            财务总监在这里既能看今天、本月、本年的财务情况，也能核对每笔流水对应的销售和执行归属。
          </p>
        </div>
        <Link
          href="/finance/new"
          className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105"
        >
          登记流水
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              现在已经支持关联订单归属。财务总监可以在这里核对销售归属和主拍执行归属。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["day", "month", "year", "all"] as const).map((period) => {
              const isActive = selectedPeriod === period;

              return (
                <Link
                  key={period}
                  href={`/finance?period=${period}`}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-[color:var(--accent)] text-white shadow-lg shadow-orange-200/70"
                      : "border border-[color:var(--line)] hover:bg-white"
                  }`}
                >
                  {periodLabels[period]}
                </Link>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm">
              <p className="muted">{periodLabels[selectedPeriod]}流水</p>
              <p className="mt-1 font-medium">{filteredEntries.length} 条</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm">
              <p className="muted">{periodLabels[selectedPeriod]}收款</p>
              <p className="mt-1 font-medium">
                {filteredEntries.filter((entry) => entry.type === "收款").length} 条
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm">
              <p className="muted">{periodLabels[selectedPeriod]}净流入</p>
              <p className="mt-1 font-medium">
                ¥
                {(
                  filteredEntries
                    .filter((entry) => entry.type === "收款")
                    .reduce((sum, entry) => sum + parseAmount(entry.amount), 0) -
                  filteredEntries
                    .filter((entry) => entry.type !== "收款")
                    .reduce((sum, entry) => sum + parseAmount(entry.amount), 0)
                ).toLocaleString("zh-CN")}{" "}
                净流入
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <FinanceTable entries={filteredEntries} ordersById={ordersById} />
        </div>
      </section>
    </AdminShell>
  );
}
