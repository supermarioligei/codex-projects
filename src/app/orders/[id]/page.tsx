import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { canAccessOrder, canEditFinance, canEditOrders, requireSession } from "@/lib/auth";
import { getFinanceEntriesByOrderId } from "@/lib/finance-store";
import { getOrderById } from "@/lib/order-store";
import { statusClassName } from "@/lib/ui";

function parseAmount(value: string) {
  return Number(value.replace(/[^\d.-]/g, "")) || 0;
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;
  const query = await searchParams;
  const order = await getOrderById(id);

  if (!order || !canAccessOrder(order, user)) {
    notFound();
  }

  const linkedEntries = await getFinanceEntriesByOrderId(order.id);
  const totalAmount = parseAmount(order.amount);
  const paidPercent = totalAmount > 0 ? Math.min((order.receivedTotal / totalAmount) * 100, 100) : 0;

  return (
    <AdminShell
      activeHref="/orders"
      title="订单详情"
      description="查看单个订单的拍摄安排、回款进度和关联流水。"
      aside={
        <>
          <p className="text-sm font-semibold">当前跟进建议</p>
          <p className="mt-2 text-sm leading-6 muted">
            {order.outstandingAmount > 0
              ? `这单还有 ¥${order.outstandingAmount.toLocaleString("zh-CN")} 待收，建议在交付前完成尾款确认。`
              : "这单回款已经完成，可以重点跟进交付节点和客户满意度。"}
          </p>
        </>
      }
    >
      {query.updated === "1" ? (
        <section className="rounded-[1.5rem] border border-[#cfe7db] bg-[#f2fbf6] px-5 py-4 text-sm text-[#25644d]">
          订单信息已保存，详情页和列表页已经同步更新。
        </section>
      ) : null}

      <div className="flex flex-col gap-4 rounded-[2rem] bg-[linear-gradient(135deg,#234843_0%,#4b796f_45%,#ef946c_100%)] px-6 py-6 text-white lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/72">Order Detail</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {order.customer}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
            {order.school} · {order.campus} · {order.className} · {order.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canEditOrders(user.role) ? (
            <Link
              href={`/orders/${order.id}/edit`}
              className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/60 transition hover:brightness-105"
            >
              编辑订单
            </Link>
          ) : null}
          {canEditFinance(user.role) ? (
            <Link
              href="/finance/new"
              className="rounded-full bg-white/14 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/18 transition hover:bg-white/18"
            >
              为此订单登记流水
            </Link>
          ) : null}
          <Link
            href="/orders"
            className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            返回订单列表
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">订单总额</p>
          <h3 className="mt-4 text-3xl font-semibold">{order.amount}</h3>
          <p className="mt-3 text-sm leading-6 muted">当前订单签约金额</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">已收金额</p>
          <h3 className="mt-4 text-3xl font-semibold">{order.paid}</h3>
          <p className="mt-3 text-sm leading-6 muted">根据关联收款和退款自动汇总</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">待收金额</p>
          <h3 className="mt-4 text-3xl font-semibold">
            ¥{order.outstandingAmount.toLocaleString("zh-CN")}
          </h3>
          <p className="mt-3 text-sm leading-6 muted">用于尾款跟进和交付前核对</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">关联流水</p>
          <h3 className="mt-4 text-3xl font-semibold">{order.linkedFinanceCount} 条</h3>
          <p className="mt-3 text-sm leading-6 muted">已挂到当前订单的收款或退款记录</p>
        </article>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="soft-card rounded-[1.75rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">订单资料</p>
              <p className="mt-1 text-sm muted">把业务信息、拍摄节点和客户信息放在一起看</p>
            </div>
            <span className={statusClassName[order.status]}>{order.status}</span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-4">
              <p className="text-sm muted">联系人</p>
              <p className="mt-2 font-semibold">{order.contact}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-4">
              <p className="text-sm muted">拍摄时间</p>
              <p className="mt-2 font-semibold">{order.shootDate}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-4">
              <p className="text-sm muted">拍摄地点</p>
              <p className="mt-2 font-semibold">{order.location || "待补充"}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-4">
              <p className="text-sm muted">套餐类型</p>
              <p className="mt-2 font-semibold">{order.packageName}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-4">
              <p className="text-sm muted">摄影师安排</p>
              <p className="mt-2 font-semibold">{order.photographer || "暂未安排"}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-4">
              <p className="text-sm muted">录入时间</p>
              <p className="mt-2 font-semibold">
                {order.createdAt ? order.createdAt.slice(0, 10) : "演示数据"}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">回款进度</p>
              <p className="text-sm muted">{paidPercent.toFixed(0)}%</p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#f3e7d8]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#df6f4f_0%,#f3a67f_100%)]"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-6 muted">
              已收 {order.paid}，待收 ¥{order.outstandingAmount.toLocaleString("zh-CN")}。
            </p>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-4">
            <p className="text-sm font-semibold">备注</p>
            <p className="mt-3 text-sm leading-7 muted">
              {order.notes || "当前还没有补充拍摄要求、交付时限或客户特别说明。"}
            </p>
          </div>
        </section>

        <section className="soft-card rounded-[1.75rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">关联流水</p>
              <p className="mt-1 text-sm muted">这单的收款和退款明细</p>
            </div>
            <Link
              href="/finance"
              className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-medium hover:bg-white"
            >
              打开流水页
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {linkedEntries.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line)] bg-white/70 px-4 py-6 text-sm muted">
                这单暂时还没有关联流水。可以去“登记流水”里补录定金、尾款或退款。
              </div>
            ) : (
              linkedEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{entry.title}</p>
                      <p className="mt-1 text-sm muted">
                        {entry.category || "未分类"} · {entry.time}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        entry.amount.startsWith("+")
                          ? "text-[color:var(--success)]"
                          : "text-[#bc5f4a]"
                      }`}
                    >
                      {entry.amount}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 muted">
                    {entry.counterparty || "未填写往来方"}
                    {entry.notes ? ` · ${entry.notes}` : ""}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
