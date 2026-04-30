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
  const assignmentCount = reminders.filter((item) => item.id.startsWith("crew-")).length;
  const dueSoonCount = reminders.filter((item) => item.id.startsWith("due-")).length;
  const highPriorityCount = reminders.filter((item) => item.level === "高优先级").length;

  const roleTitles = {
    owner: "提醒中心",
    sales: "销售提醒中心",
    production_manager: "拍摄执行提醒",
    finance_director: "财务提醒",
    delivery_manager: "交付提醒中心",
    photographer: "我的执行提醒",
  } as const;
  const roleDescriptions = {
    owner: "系统根据订单状态、拍摄日期和关联流水自动生成待办提醒。",
    sales: "优先关注待确认订单、待收尾款和临近拍摄前还需要销售补位的单子。",
    production_manager: "优先关注明日拍摄、导演安排和主辅拍执行团队的缺口。",
    finance_director: "优先关注待收尾款、交付前未收齐和异常退款支出风险。",
    delivery_manager: "优先关注合同交付日期、待选片和待交付但仍存在卡点的订单。",
    photographer: "系统根据分配给你的订单自动生成拍摄和交付协作提醒。",
  } as const;
  const roleAdvice = {
    owner: "每天先处理高优先级提醒，再跟进本周拍摄且仍有待收尾款的订单，现场和回款都会更稳。",
    sales: "先联系本周就要拍、但尾款或客户确认还没跟上的订单，再处理普通跟进项。",
    production_manager: "先把明日和本周场次的导演、主辅拍补齐，再处理临近交付但执行信息不完整的单。",
    finance_director: "先处理高金额未回款订单，再核对交付前仍未登记尾款的合同。",
    delivery_manager: "先处理合同交付日期临近的单，再追拍摄已完成但选片和交付推进缓慢的单。",
    photographer: "每天先处理高优先级拍摄提醒，再确认明天场次、联系人和需要你协作交付的订单。",
  } as const;

  const spotlightCards = {
    owner: [
      { label: "全部提醒", value: `${reminders.length} 条`, detail: "当前自动识别出的全部待办事项" },
      { label: "高优先级", value: `${highPriorityCount} 条`, detail: "建议今天优先清掉的风险事项" },
      { label: "拍摄提醒", value: `${shootCount} 条`, detail: "涉及今日、明日和待补执行安排" },
      { label: "交付提醒", value: `${deliveryCount} 条`, detail: "涉及待选片、待交付和超期风险" },
    ],
    sales: [
      { label: "销售待办", value: `${reminders.length} 条`, detail: "需要销售跟进的订单提醒" },
      { label: "待收尾款", value: `${financeCount} 条`, detail: "本周拍摄前后仍未收齐款项的单子" },
      { label: "临近拍摄", value: `${shootCount} 条`, detail: "适合今天就联系客户确认细节" },
      { label: "高优先级", value: `${highPriorityCount} 条`, detail: "优先处理金额高或时间紧的合同" },
    ],
    production_manager: [
      { label: "执行提醒", value: `${reminders.length} 条`, detail: "系统识别出的排期与执行待办" },
      { label: "待补执行安排", value: `${assignmentCount} 条`, detail: "导演、主拍或主拍摄像尚未补齐" },
      { label: "本周拍摄提醒", value: `${shootCount} 条`, detail: "今日和明日拍摄要尽快过一遍执行团队" },
      { label: "交付联动", value: `${deliveryCount} 条`, detail: "拍摄进度可能影响后续交付的单子" },
    ],
    finance_director: [
      { label: "财务待办", value: `${financeCount} 条`, detail: "以待收尾款和异常回款提醒为主" },
      { label: "交付前未收齐", value: `${deliveryCount} 条`, detail: "待选片或待交付但仍缺尾款的订单" },
      { label: "全部提醒", value: `${reminders.length} 条`, detail: "综合提醒，便于和销售、交付协作" },
      { label: "高优先级", value: `${highPriorityCount} 条`, detail: "建议今天优先处理的财务风险" },
    ],
    delivery_manager: [
      { label: "交付待办", value: `${deliveryCount} 条`, detail: "围绕交付日期、选片和交付节点" },
      { label: "临近交付截止", value: `${dueSoonCount} 条`, detail: "合同交付日期临近，需优先追踪" },
      { label: "拍摄衔接", value: `${shootCount} 条`, detail: "拍摄排期会影响交付节奏的单子" },
      { label: "全部提醒", value: `${reminders.length} 条`, detail: "便于统一安排交付推进顺序" },
    ],
    photographer: [
      { label: "我的提醒", value: `${reminders.length} 条`, detail: "系统只保留分配给你的执行事项" },
      { label: "高优先级", value: `${highPriorityCount} 条`, detail: "今天或明天需要你优先处理的单子" },
      { label: "拍摄提醒", value: `${shootCount} 条`, detail: "围绕今日、明日和待确认执行细节" },
      { label: "交付协作", value: `${deliveryCount} 条`, detail: "需要你配合交付或产出交接的订单" },
    ],
  } as const;

  return (
    <AdminShell
      activeHref="/alerts"
      title={roleTitles[user.role]}
      description={roleDescriptions[user.role]}
      aside={
        <>
          <p className="text-sm font-semibold">使用建议</p>
          <p className="mt-2 text-sm leading-6 muted">{roleAdvice[user.role]}</p>
        </>
      }
    >
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,#1f4741_0%,#49766c_42%,#ef966e_100%)] px-6 py-7 text-white shadow-2xl shadow-orange-100/70">
        <p className="text-sm uppercase tracking-[0.24em] text-white/74">Alerts</p>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">自动提醒总览</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
          {user.role === "photographer"
            ? "提醒会根据分配给你的订单自动计算，只保留你真正需要处理的执行事项。"
            : user.role === "sales"
              ? "销售在这里优先看客户确认、尾款跟进和临近拍摄前仍需补位的合同。"
              : user.role === "production_manager"
                ? "拍摄主管在这里优先看导演、主辅拍和主辅摄像是否安排完整。"
                : user.role === "delivery_manager"
                  ? "交付主管在这里优先看合同交付日期、拍摄衔接和待选片推进情况。"
                  : "提醒已经不再靠手工录入，而是会根据拍摄日期、订单状态和流水关联自动计算。"}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {spotlightCards[user.role].map((card) => (
          <article key={card.label} className="soft-card rounded-[1.5rem] p-5">
            <p className="text-sm muted">{card.label}</p>
            <h3 className="mt-4 text-3xl font-semibold">{card.value}</h3>
            <p className="mt-3 text-sm leading-6 muted">{card.detail}</p>
          </article>
        ))}
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
