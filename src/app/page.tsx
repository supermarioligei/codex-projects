import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { OrdersTable } from "@/components/orders-table";
import {
  canEditFinance,
  canEditOrders,
  canViewDelivery,
  canViewFinance,
  filterOrdersForUser,
  requireSession,
} from "@/lib/auth";
import { buildDashboardMetrics } from "@/lib/dashboard";
import { getFinanceEntries } from "@/lib/finance-store";
import { getOrders } from "@/lib/order-store";
import { filterRemindersForPhotographer, generateReminders } from "@/lib/reminders";

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN")}`;
}

export default async function Home() {
  const user = await requireSession();
  const [allOrders, financeEntries] = await Promise.all([getOrders(), getFinanceEntries()]);
  const orders = filterOrdersForUser(allOrders, user);
  const baseReminders = generateReminders(orders, financeEntries);
  const reminders =
    user.role === "photographer"
      ? filterRemindersForPhotographer(baseReminders)
      : baseReminders;
  const metrics = buildDashboardMetrics(orders, financeEntries, reminders);

  const quickLinks = [
    canEditOrders(user.role)
      ? { title: "新建订单", hint: "登记客户、班级、套餐和收款信息", href: "/orders/new" }
      : { title: "我的拍摄订单", hint: "查看自己近期要执行的拍摄任务", href: "/orders" },
    canEditFinance(user.role)
      ? { title: "登记流水", hint: "录入收款、退款、支出和分成", href: "/finance/new" }
      : { title: "拍摄排期", hint: "查看本周场次、待分配摄影师和明日拍摄", href: "/schedule" },
    canViewDelivery(user.role)
      ? { title: "交付中心", hint: "集中查看待选片、待交付与已完成订单", href: "/delivery" }
      : { title: "提醒中心", hint: "自动汇总拍摄、回款和交付待办", href: "/alerts" },
    canViewFinance(user.role)
      ? { title: "账务流水", hint: "查看回款、退款和支出明细", href: "/finance" }
      : { title: "订单列表", hint: "按拍摄时间查看全部业务订单", href: "/orders" },
  ];

  const headlineCards = [
    {
      label: user.role === "photographer" ? "本周拍摄场次" : "本月签单额",
      value:
        user.role === "photographer"
          ? `${metrics.weeklyShoots.length} 场`
          : formatCurrency(metrics.monthlySignedAmount),
      change:
        user.role === "photographer"
          ? `${metrics.weeklyShoots.filter((order) => !order.photographer).length} 场待配人`
          : `${orders.length} 单在库`,
      detail:
        user.role === "photographer"
          ? "未来 7 天内需要执行的拍摄任务"
          : "按当前拍摄月份归集的订单签约金额",
    },
    {
      label: user.role === "photographer" ? "待安排摄影师" : "累计回款额",
      value:
        user.role === "photographer"
          ? `${metrics.weeklyShoots.filter((order) => !order.photographer).length} 场`
          : formatCurrency(metrics.monthlyReceivedAmount),
      change:
        user.role === "photographer"
          ? `${reminders.filter((item) => item.category === "拍摄提醒").length} 条提醒`
          : `${formatCurrency(metrics.monthlyRefundAmount)} 退款`,
      detail:
        user.role === "photographer"
          ? "还没有明确摄影师安排的本周场次"
          : "收款流水累计值，可用于观察回款节奏",
    },
    {
      label: user.role === "photographer" ? "今日待办" : "本周拍摄场次",
      value:
        user.role === "photographer"
          ? `${reminders.filter((item) => item.level === "高优先级").length} 条`
          : `${metrics.weeklyShoots.length} 场`,
      change:
        user.role === "photographer"
          ? `${metrics.reminderBreakdown.shoot} 条拍摄提醒`
          : `${metrics.weeklyShoots.filter((order) => !order.photographer).length} 场待配人`,
      detail:
        user.role === "photographer"
          ? "优先处理今天和明天要拍的高优先级事项"
          : "未来 7 天内待执行的拍摄任务",
    },
    {
      label: user.role === "photographer" ? "待交付协作" : "交付中订单",
      value: `${metrics.deliveryActive.length} 单`,
      change:
        user.role === "photographer"
          ? `${metrics.reminderBreakdown.delivery} 条交付提醒`
          : `${formatCurrency(
              metrics.deliveryActive.reduce((sum, order) => sum + order.outstandingAmount, 0),
            )} 待收`,
      detail:
        user.role === "photographer"
          ? "已拍完成后需要协同选片和交付的订单数量"
          : "待选片与待交付订单需要重点盯回款和交片",
    },
  ];

  const focusOrders =
    user.role === "photographer"
      ? metrics.weeklyShoots.slice(0, 6)
      : metrics.highRiskOrders.length > 0
        ? metrics.highRiskOrders
        : orders.slice(0, 6);

  return (
    <AdminShell
      activeHref="/"
      title={
        user.role === "owner"
          ? "儿童毕业摄影经营看板"
          : user.role === "sales"
            ? "客服业务工作台"
            : "摄影师执行工作台"
      }
      description={
        user.role === "owner"
          ? "从签单、回款、排期到交付，把老板最关心的经营数据放到首页。"
          : user.role === "sales"
            ? "优先关注订单推进、尾款回收、提醒处理和交付协作。"
            : "优先关注本周拍摄、人员安排、执行提醒和待协同交付任务。"
      }
    >
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,#1f433f_0%,#4d776d_38%,#f09168_100%)] px-6 py-7 text-white shadow-2xl shadow-orange-100/70">
        <p className="text-sm uppercase tracking-[0.28em] text-white/72">Business Dashboard</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h2 className="max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl">
              {user.role === "owner"
                ? "先看经营，再看执行。首页会优先告诉你签了多少、收了多少、这周要拍多少、还有哪些钱和交付没收回来。"
                : user.role === "sales"
                  ? "先盯订单推进，再盯尾款和交付。首页优先告诉你哪些单最需要客服今天处理。"
                  : "先看今天拍什么、谁还没安排、哪些订单需要你配合交付。首页会把执行压力先给你看。"}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/82 sm:text-base">
              这版数据已经基于真实订单、真实流水和自动提醒计算，不再只是静态展示。
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/20 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm text-white/74">工作摘要</p>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-3xl font-semibold">
                  {user.role === "photographer"
                    ? `${metrics.weeklyShoots.length} 场`
                    : formatCurrency(
                        metrics.monthlyReceivedAmount -
                          metrics.monthlyRefundAmount -
                          metrics.monthlyCostAmount,
                      )}
                </p>
                <p className="text-sm text-white/78">
                  {user.role === "photographer" ? "本周执行任务" : "当前净流入"}
                </p>
              </div>
              <div>
                <p className="text-3xl font-semibold">{reminders.length} 条</p>
                <p className="text-sm text-white/78">系统识别待办</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {headlineCards.map((stat) => (
          <article key={stat.label} className="soft-card rounded-[1.75rem] p-5">
            <p className="text-sm muted">{stat.label}</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <h3 className="text-3xl font-semibold tracking-tight">{stat.value}</h3>
              <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold metric-accent">
                {stat.change}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 muted">{stat.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <section className="soft-card rounded-[1.75rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">
                {user.role === "photographer" ? "本周重点执行订单" : "高风险订单"}
              </p>
              <p className="mt-1 text-sm muted">
                {user.role === "photographer"
                  ? "优先关注临近拍摄、未安排摄影师或提醒较多的订单"
                  : "优先关注待收金额高、又临近拍摄或交付的订单"}
              </p>
            </div>
            <Link
              href={user.role === "photographer" ? "/schedule" : "/alerts"}
              className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-medium hover:bg-white"
            >
              {user.role === "photographer" ? "打开拍摄排期" : "打开提醒中心"}
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {focusOrders.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line)] bg-white/75 px-4 py-6 text-sm muted">
                {user.role === "photographer"
                  ? "当前本周没有待执行的拍摄任务。"
                  : "当前没有明显的高风险订单，回款和交付节奏比较健康。"}
              </div>
            ) : (
              focusOrders.map((order) => (
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
                        {order.shootDate} · {order.status} · {order.photographer || "待安排摄影师"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#bc5f4a]">
                      {user.role === "photographer"
                        ? order.photographer || "待安排摄影师"
                        : `待收 ${formatCurrency(order.outstandingAmount)}`}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 muted">
                    {user.role === "photographer"
                      ? `${order.location || "地点待补充"} · 已收 ${order.paid} · ${order.school}`
                      : `已收 ${order.paid} / 总额 ${order.amount} · ${order.school} · ${order.className}`}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="soft-card rounded-[1.75rem] p-5">
            <div>
              <p className="text-sm font-semibold">
                {user.role === "photographer" ? "执行提醒分布" : "提醒分布"}
              </p>
              <p className="mt-1 text-sm muted">
                {user.role === "photographer"
                  ? "先看拍摄提醒，再看需要配合交付的任务"
                  : "看今天更需要盯拍摄、财务还是交付"}
              </p>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">拍摄提醒</p>
                  <span className="text-sm font-semibold">{metrics.reminderBreakdown.shoot} 条</span>
                </div>
                <p className="mt-2 text-sm leading-6 muted">围绕今日、明日和待配摄影师的场次</p>
              </div>
              <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">财务提醒</p>
                  <span className="text-sm font-semibold">{metrics.reminderBreakdown.finance} 条</span>
                </div>
                <p className="mt-2 text-sm leading-6 muted">
                  {user.role === "photographer"
                    ? "摄影师不直接处理财务，但可以知道哪些订单需要先确认尾款"
                    : "本周待收尾款和金额较高的风险订单"}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">交付提醒</p>
                  <span className="text-sm font-semibold">{metrics.reminderBreakdown.delivery} 条</span>
                </div>
                <p className="mt-2 text-sm leading-6 muted">待选片和待交付订单里的关键节点</p>
              </div>
            </div>
          </section>

          <section className="soft-card rounded-[1.75rem] p-5">
            <div>
              <p className="text-sm font-semibold">
                {user.role === "photographer" ? "协作摘要" : "经营流水摘要"}
              </p>
              <p className="mt-1 text-sm muted">
                {user.role === "photographer"
                  ? "帮助摄影师理解哪些单回款、交付和执行协同最紧张"
                  : "用最少信息看到钱从哪里来、花到哪里去"}
              </p>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                <p className="text-sm font-semibold">
                  {user.role === "photographer" ? "待交付订单" : "累计收款"}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--success)]">
                  {user.role === "photographer"
                    ? `${metrics.deliveryActive.length} 单`
                    : formatCurrency(metrics.monthlyReceivedAmount)}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                  <p className="text-sm font-semibold">
                    {user.role === "photographer" ? "已安排摄影师" : "退款"}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#bc5f4a]">
                    {user.role === "photographer"
                      ? `${metrics.weeklyShoots.filter((order) => order.photographer).length} 场`
                      : formatCurrency(metrics.monthlyRefundAmount)}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                  <p className="text-sm font-semibold">
                    {user.role === "photographer" ? "待安排摄影师" : "支出"}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#bc5f4a]">
                    {user.role === "photographer"
                      ? `${metrics.weeklyShoots.filter((order) => !order.photographer).length} 场`
                      : formatCurrency(metrics.monthlyCostAmount)}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="soft-card rounded-[1.75rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              {user.role === "photographer" ? "近期执行订单" : "重点订单看板"}
            </p>
            <p className="mt-1 text-sm muted">
              {user.role === "photographer"
                ? "保留近期最需要执行和协同的订单，方便快速查看拍摄细节"
                : "保留最关键的最近订单，方便老板和客服快速下钻查看"}
            </p>
          </div>
          <Link
            href="/orders"
            className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-medium hover:bg-white"
          >
            查看全部订单
          </Link>
        </div>

        <div className="mt-5">
          <OrdersTable orders={orders.slice(0, 6)} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {quickLinks.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="soft-card rounded-[1.5rem] p-5 transition hover:-translate-y-0.5 hover:bg-white"
          >
            <p className="text-lg font-semibold">{item.title}</p>
            <p className="mt-3 text-sm leading-6 muted">{item.hint}</p>
          </Link>
        ))}
      </section>
    </AdminShell>
  );
}
