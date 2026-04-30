import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { filterOrdersForUser, requireSession } from "@/lib/auth";
import { getFinanceEntries } from "@/lib/finance-store";
import { getOrders } from "@/lib/order-store";
import { filterRemindersForPhotographer, generateReminders } from "@/lib/reminders";

export default async function AlertsPage() {
  const user = await requireSession();
  const [allOrders, financeEntries] = await Promise.all([
    getOrders(),
    getFinanceEntries(),
  ]);
  const orders = filterOrdersForUser(allOrders, user);
  const reminders =
    user.role === "photographer"
      ? filterRemindersForPhotographer(generateReminders(orders, financeEntries))
      : generateReminders(orders, financeEntries);
  const shootCount = reminders.filter((item) => item.category === "拍摄提醒").length;
  const financeCount = reminders.filter((item) => item.category === "财务提醒").length;
  const deliveryCount = reminders.filter((item) => item.category === "交付提醒").length;

  return (
    <AdminShell
      activeHref="/alerts"
      title={user.role === "photographer" ? "我的执行提醒" : "提醒中心"}
      description={
        user.role === "photographer"
          ? "系统根据分配给你的订单自动生成拍摄和交付协作提醒。"
          : "系统根据订单状态、拍摄日期和关联流水自动生成待办提醒。"
      }
      aside={
        <>
          <p className="text-sm font-semibold">使用建议</p>
          <p className="mt-2 text-sm leading-6 muted">
            {user.role === "photographer"
              ? "每天先处理高优先级拍摄提醒，再确认明天场次、联系人和需要你协作交付的订单。"
              : "每天先处理高优先级提醒，再跟进本周拍摄且仍有待收尾款的订单，现场和回款都会更稳。"}
          </p>
        </>
      }
    >
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,#1f4741_0%,#49766c_42%,#ef966e_100%)] px-6 py-7 text-white shadow-2xl shadow-orange-100/70">
        <p className="text-sm uppercase tracking-[0.24em] text-white/74">Alerts</p>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">自动提醒总览</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
          {user.role === "photographer"
            ? "提醒会根据分配给你的订单自动计算，只保留你真正需要处理的执行事项。"
            : "提醒已经不再靠手工录入，而是会根据拍摄日期、订单状态和流水关联自动计算。"}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">全部提醒</p>
          <h3 className="mt-4 text-3xl font-semibold">{reminders.length} 条</h3>
          <p className="mt-3 text-sm leading-6 muted">当前自动识别出的全部待办事项</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">拍摄提醒</p>
          <h3 className="mt-4 text-3xl font-semibold">{shootCount} 条</h3>
          <p className="mt-3 text-sm leading-6 muted">今日、明日拍摄和待安排摄影师的场次</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">财务提醒</p>
          <h3 className="mt-4 text-3xl font-semibold">{financeCount} 条</h3>
          <p className="mt-3 text-sm leading-6 muted">本周待收尾款和大额未回款订单</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">交付提醒</p>
          <h3 className="mt-4 text-3xl font-semibold">{deliveryCount} 条</h3>
          <p className="mt-3 text-sm leading-6 muted">待选片、待交付但未收尾款的订单</p>
        </article>
      </section>

      <section className="soft-card rounded-[1.75rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">全部提醒列表</p>
            <p className="mt-1 text-sm muted">按类别和优先级排序，点击可直接跳转处理</p>
          </div>
          <span className="rounded-full bg-[#f7eadc] px-3 py-1 text-xs font-semibold text-[#b96c32]">
            {reminders.length} 条待处理
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {reminders.length === 0 ? (
            <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line)] bg-white/75 px-4 py-6 text-sm muted">
              当前没有自动提醒，说明近期排期、回款和交付节点都比较平稳。
            </div>
          ) : (
            reminders.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 muted">{item.detail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a05e2a]">
                      {item.category}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[#b96c32]">
                      {item.level}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-[color:var(--accent)]"
                  >
                    立即处理
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </AdminShell>
  );
}
