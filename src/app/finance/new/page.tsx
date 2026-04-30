import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { createFinanceEntryAction } from "@/app/finance/new/actions";
import { getOrders } from "@/lib/order-store";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#93a09d] focus:border-[color:var(--accent)]";

export default async function NewFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const orders = await getOrders();

  return (
    <AdminShell
      activeHref="/finance/new"
      title="登记流水"
      description="录入收款、退款和支出，并尽量关联到具体订单，方便后面做应收应付统计。"
      aside={
        <>
          <p className="text-sm font-semibold">录入建议</p>
          <p className="mt-2 text-sm leading-6 muted">
            只要这笔钱和某个订单相关，就尽量选上订单，后面尾款跟进会轻松很多。
          </p>
        </>
      }
    >
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,#21443f_0%,#49756b_42%,#f0a07a_100%)] px-6 py-7 text-white shadow-2xl shadow-orange-100/70">
        <p className="text-sm uppercase tracking-[0.24em] text-white/74">New Finance</p>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">账务流水录入</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
          录入后会自动回到流水列表页。现在已经支持关联订单，后续可以继续扩展为自动更新订单实收金额。
        </p>
      </div>

      <section className="soft-card rounded-[1.75rem] p-5">
        {params.error === "missing" ? (
          <div className="mb-5 rounded-2xl border border-[#f0c8b2] bg-[#fff4ee] px-4 py-3 text-sm text-[#a3512d]">
            请先补全流水类型、摘要和金额这几个必填项。
          </div>
        ) : null}

        <form action={createFinanceEntryAction}>
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="text-sm font-medium">
              流水类型
              <select name="type" required className={fieldClassName} defaultValue="收款">
                <option>收款</option>
                <option>退款</option>
                <option>支出</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              流水摘要
              <input
                name="title"
                required
                className={fieldClassName}
                placeholder="例如：星辰幼儿园第二笔尾款"
              />
            </label>
            <label className="text-sm font-medium">
              金额
              <input
                name="amount"
                required
                className={fieldClassName}
                placeholder="例如：3000"
              />
            </label>
            <label className="text-sm font-medium">
              发生时间
              <input name="happenedAt" type="datetime-local" className={fieldClassName} />
            </label>
            <label className="text-sm font-medium">
              关联订单
              <select name="orderId" className={fieldClassName} defaultValue="">
                <option value="">暂不关联订单</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.customer} · {order.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              流水分类
              <select name="category" className={fieldClassName} defaultValue="">
                <option value="">请选择分类</option>
                <option>订单定金</option>
                <option>订单尾款</option>
                <option>加选增购</option>
                <option>摄影师成本</option>
                <option>后期修图</option>
                <option>交通支出</option>
                <option>道具物料</option>
                <option>售后退款</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              往来方
              <input
                name="counterparty"
                className={fieldClassName}
                placeholder="例如：张园长 / 摄影师阿峰 / 滴滴企业出行"
              />
            </label>
          </div>

          <label className="mt-5 block text-sm font-medium">
            备注
            <textarea
              name="notes"
              className={`${fieldClassName} min-h-32 resize-y`}
              placeholder="记录付款说明、退款原因、发票备注、成本说明等"
            />
          </label>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105">
              保存流水
            </button>
            <Link
              href="/finance"
              className="rounded-full border border-[color:var(--line)] px-5 py-3 text-center text-sm font-semibold hover:bg-white"
            >
              返回流水列表
            </Link>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}
