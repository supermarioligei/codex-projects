import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { OrdersTable } from "@/components/orders-table";
import {
  canCreateOrders,
  canEditFinance,
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

  const roleTitles = {
    owner: "儿童毕业摄影经营看板",
    sales: "销售工作台",
    production_manager: "拍摄执行工作台",
    finance_director: "财务总监工作台",
    delivery_manager: "交付主管工作台",
    photographer: "拍摄执行工作台",
  } as const;
  const roleDescriptions = {
    owner: "从签单、回款、排期到交付，把老板最关心的经营数据放到首页。",
    sales: "优先关注新订单、客户跟进和重点提醒。",
    production_manager: "优先关注排期、导演安排、主辅拍协同和整体执行进度。",
    finance_director: "优先关注流水、订单归属、回款进度和整体财务情况。",
    delivery_manager: "优先关注拍摄执行衔接、交付进度和超期风险。",
    photographer: "优先关注本周拍摄、人员安排、执行提醒和待协同交付任务。",
  } as const;
  const missingCrewCount = orders.filter(
    (order) =>
      order.status === "待拍摄" &&
      (!order.director?.trim() || !order.photographer?.trim() || !order.leadVideographer?.trim()),
  ).length;
  const deliveryDueSoonCount = orders.filter((order) => {
    if (!order.deliveryDueDate || (order.status !== "待选片" && order.status !== "待交付")) {
      return false;
    }

    const due = new Date(`${order.deliveryDueDate}T23:59:59`);
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    return due <= inThreeDays;
  }).length;
  const pendingCollectionCount = orders.filter((order) => order.outstandingAmount > 0).length;
  const highPriorityReminderCount = reminders.filter((item) => item.level === "高优先级").length;

  const quickLinks = [
    user.role === "sales"
      ? { title: "新建订单", hint: "登记客户、学校、合同金额和交付日期", href: "/orders/new" }
      : user.role === "production_manager"
        ? { title: "拍摄排期", hint: "先补导演、主拍和摄像安排", href: "/schedule" }
        : user.role === "finance_director"
        ? { title: "账务流水", hint: "查看全部回款、退款、支出和订单归属", href: "/finance" }
        : user.role === "delivery_manager"
          ? { title: "交付中心", hint: "盯交付日期、产出进度和交付风险", href: "/delivery" }
        : canCreateOrders(user.role)
          ? { title: "新建订单", hint: "登记客户、班级、套餐和收款信息", href: "/orders/new" }
          : { title: "我的拍摄订单", hint: "查看自己近期要执行的拍摄任务", href: "/orders" },
    user.role === "delivery_manager"
      ? { title: "交付中心", hint: "盯交付日期、选片节点和交付超期风险", href: "/delivery" }
      : user.role === "production_manager"
        ? { title: "订单管理", hint: "统一查看订单执行情况并补执行团队", href: "/orders" }
      : canEditFinance(user.role)
        ? { title: "登记流水", hint: "录入收款、退款、支出和分成", href: "/finance/new" }
        : { title: "拍摄排期", hint: "查看本周场次、待分配摄影师和明日拍摄", href: "/schedule" },
    canViewDelivery(user.role)
      ? { title: "交付中心", hint: "集中查看待选片、待交付与已完成订单", href: "/delivery" }
      : { title: "提醒中心", hint: "自动汇总拍摄、回款和交付待办", href: "/alerts" },
    canViewFinance(user.role)
      ? { title: "账务流水", hint: "查看回款、退款和支出明细", href: "/finance" }
      : { title: "订单列表", hint: "按拍摄时间查看全部业务订单", href: "/orders" },
  ];
  let headlineCards = [
    {
      label: "本月签单额",
      value: formatCurrency(metrics.monthlySignedAmount),
      change: `${orders.length} 单在库`,
      detail: "按当前拍摄月份归集的订单签约金额",
    },
    {
      label: "本月回款额",
      value: formatCurrency(metrics.monthlyReceivedAmount),
      change: `${formatCurrency(metrics.monthlyRefundAmount)} 退款`,
      detail: "用于观察这个月的真实回款节奏",
    },
    {
      label: "本周拍摄场次",
      value: `${metrics.weeklyShoots.length} 场`,
      change: `${missingCrewCount} 场执行待补`,
      detail: "未来 7 天内待执行的拍摄任务",
    },
    {
      label: "交付中订单",
      value: `${metrics.deliveryActive.length} 单`,
      change: `${formatCurrency(metrics.deliveryActive.reduce((sum, order) => sum + order.outstandingAmount, 0))} 待收`,
      detail: "待选片与待交付订单需要重点盯回款和交片",
    },
  ];
  let focusOrders = metrics.highRiskOrders.length > 0 ? metrics.highRiskOrders : orders.slice(0, 6);
  let focusTitle = "高风险订单";
  let focusDescription = "优先关注待收金额高、又临近拍摄或交付的订单";
  let focusHref = "/alerts";
  let focusEmptyText = "当前没有明显的高风险订单，回款和交付节奏比较健康。";
  let reminderPanelTitle = "提醒分布";
  let reminderPanelDescription = "看今天更需要盯拍摄、财务还是交付";
  let summaryPanelTitle = "经营流水摘要";
  let summaryPanelDescription = "用最少信息看到钱从哪里来、花到哪里去";
  let summaryPrimaryLabel = "累计收款";
  let summaryPrimaryValue = formatCurrency(metrics.yearlyReceivedAmount);
  let summarySecondaryLeftLabel = "退款";
  let summarySecondaryLeftValue = formatCurrency(metrics.yearlyRefundAmount);
  let summarySecondaryRightLabel = "支出";
  let summarySecondaryRightValue = formatCurrency(metrics.yearlyCostAmount);

  if (user.role === "sales") {
    headlineCards = [
      {
        label: "本月签单额",
        value: formatCurrency(metrics.monthlySignedAmount),
        change: `${orders.length} 单在跟`,
        detail: "销售最先关注的签单总盘子",
      },
      {
        label: "待收订单",
        value: `${pendingCollectionCount} 单`,
        change: `${formatCurrency(metrics.monthlyReceivedAmount)} 本月回款`,
        detail: "适合今天继续推进回款或补合同信息",
      },
      {
        label: "本周拍摄前跟进",
        value: `${metrics.reminderBreakdown.shoot} 条`,
        change: `${highPriorityReminderCount} 条高优先级`,
        detail: "临近拍摄前仍需要销售确认的订单",
      },
      {
        label: "交付前待确认",
        value: `${metrics.reminderBreakdown.delivery} 条`,
        change: `${metrics.deliveryActive.length} 单交付中`,
        detail: "便于提前处理客户预期与尾款节点",
      },
    ];
    focusOrders = orders
      .filter((order) => order.outstandingAmount > 0 || order.status === "待确认")
      .slice(0, 6);
    focusTitle = "销售重点跟进订单";
    focusDescription = "优先关注待确认、待收尾款和临近拍摄的合同";
    focusEmptyText = "当前没有需要销售优先补位的订单。";
    focusHref = "/orders";
    reminderPanelDescription = "看今天更需要跟进客户确认、回款还是交付预期";
    summaryPanelTitle = "销售结果摘要";
    summaryPanelDescription = "帮助销售快速理解签单、回款和交付前沟通压力";
    summaryPrimaryLabel = "本月回款";
    summaryPrimaryValue = formatCurrency(metrics.monthlyReceivedAmount);
    summarySecondaryLeftLabel = "本月签单";
    summarySecondaryLeftValue = formatCurrency(metrics.monthlySignedAmount);
    summarySecondaryRightLabel = "待收订单";
    summarySecondaryRightValue = `${pendingCollectionCount} 单`;
  } else if (user.role === "production_manager") {
    headlineCards = [
      {
        label: "本周拍摄场次",
        value: `${metrics.weeklyShoots.length} 场`,
        change: `${metrics.weeklyShoots.filter((order) => order.director).length} 场已排导演`,
        detail: "未来 7 天要落地执行的拍摄任务",
      },
      {
        label: "待补执行团队",
        value: `${missingCrewCount} 场`,
        change: `${metrics.reminderBreakdown.shoot} 条执行提醒`,
        detail: "导演、主拍或主拍摄像还未补齐的订单",
      },
      {
        label: "交付联动风险",
        value: `${deliveryDueSoonCount} 单`,
        change: `${metrics.deliveryActive.length} 单交付中`,
        detail: "交付日期临近，执行信息需要快速回看",
      },
      {
        label: "高优先级待办",
        value: `${highPriorityReminderCount} 条`,
        change: `${metrics.reminderBreakdown.delivery} 条交付提醒`,
        detail: "建议今天先处理的排期与交付衔接事项",
      },
    ];
    focusOrders = metrics.weeklyShoots.slice(0, 6);
    focusTitle = "本周重点执行订单";
    focusDescription = "优先关注临近拍摄、导演待补和执行团队还不完整的场次";
    focusEmptyText = "当前本周没有待执行的拍摄任务。";
    focusHref = "/schedule";
    reminderPanelDescription = "拍摄主管先看执行安排，再看哪些交付单会被拍摄进度拖住";
    summaryPanelTitle = "执行协同摘要";
    summaryPanelDescription = "帮助拍摄主管快速理解排期密度、交付联动和未补执行团队";
    summaryPrimaryLabel = "本周待拍";
    summaryPrimaryValue = `${metrics.weeklyShoots.length} 场`;
    summarySecondaryLeftLabel = "导演待补";
    summarySecondaryLeftValue = `${orders.filter((order) => order.status === "待拍摄" && !order.director?.trim()).length} 场`;
    summarySecondaryRightLabel = "主拍/摄像待补";
    summarySecondaryRightValue = `${orders.filter((order) => order.status === "待拍摄" && (!order.photographer?.trim() || !order.leadVideographer?.trim())).length} 场`;
  } else if (user.role === "finance_director") {
    headlineCards = [
      {
        label: "今日收款",
        value: formatCurrency(metrics.dailyReceivedAmount),
        change: `${pendingCollectionCount} 单待收`,
        detail: "今天已登记的收款情况",
      },
      {
        label: "本月回款",
        value: formatCurrency(metrics.monthlyReceivedAmount),
        change: `${formatCurrency(metrics.monthlyRefundAmount + metrics.monthlyCostAmount)} 本月流出`,
        detail: "适合财务总监观察本月现金流节奏",
      },
      {
        label: "全年净流入",
        value: formatCurrency(
          metrics.yearlyReceivedAmount - metrics.yearlyRefundAmount - metrics.yearlyCostAmount,
        ),
        change: `${formatCurrency(metrics.yearlyReceivedAmount)} 累计收款`,
        detail: "全年收款减去退款和支出",
      },
      {
        label: "待收合同额",
        value: formatCurrency(orders.reduce((sum, order) => sum + order.outstandingAmount, 0)),
        change: `${metrics.reminderBreakdown.finance} 条财务提醒`,
        detail: "结合销售归属和执行归属优先安排催款",
      },
    ];
    focusOrders = [...orders]
      .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
      .slice(0, 6);
    focusTitle = "重点回款订单";
    focusDescription = "优先关注待收金额高、又临近拍摄或交付的订单";
    focusEmptyText = "当前没有需要财务优先追的高风险订单。";
    focusHref = "/finance";
    reminderPanelDescription = "财务总监优先看待收尾款、交付前未收齐和执行联动风险";
    summaryPanelTitle = "财务归属摘要";
    summaryPanelDescription = "帮助财务总监快速把整体流水、订单归属和执行归属对上";
    summaryPrimaryLabel = "本年收款";
    summaryPrimaryValue = formatCurrency(metrics.yearlyReceivedAmount);
    summarySecondaryLeftLabel = "本年退款";
    summarySecondaryLeftValue = formatCurrency(metrics.yearlyRefundAmount);
    summarySecondaryRightLabel = "本年支出";
    summarySecondaryRightValue = formatCurrency(metrics.yearlyCostAmount);
  } else if (user.role === "delivery_manager") {
    headlineCards = [
      {
        label: "交付中订单",
        value: `${metrics.deliveryActive.length} 单`,
        change: `${deliveryDueSoonCount} 单临近截止`,
        detail: "交付主管优先盯住待选片和待交付订单",
      },
      {
        label: "合同交付临期",
        value: `${deliveryDueSoonCount} 单`,
        change: `${metrics.reminderBreakdown.delivery} 条交付提醒`,
        detail: "建议先处理近 3 天就到交付日期的订单",
      },
      {
        label: "执行衔接观察",
        value: `${metrics.weeklyShoots.length} 场`,
        change: `${missingCrewCount} 场执行待补`,
        detail: "拍摄安排会直接影响后续产出节奏",
      },
      {
        label: "尾款未收交付单",
        value: `${metrics.deliveryActive.filter((order) => order.outstandingAmount > 0).length} 单`,
        change: `${formatCurrency(metrics.deliveryActive.reduce((sum, order) => sum + order.outstandingAmount, 0))} 待收`,
        detail: "交付前先核对尾款与合同节点，避免交片后被动",
      },
    ];
    focusOrders = metrics.deliveryActive.slice(0, 6);
    focusTitle = "交付主管重点订单";
    focusDescription = "优先关注交付日期临近、但拍摄或选片还没完全衔接上的订单";
    focusEmptyText = "当前没有需要交付主管优先追的活动订单。";
    focusHref = "/delivery";
    reminderPanelDescription = "交付主管优先看交付日期，再看哪些单还卡在拍摄与选片之间";
    summaryPanelTitle = "交付进度摘要";
    summaryPanelDescription = "帮助交付主管快速判断时间风险、尾款风险和执行衔接风险";
    summaryPrimaryLabel = "临近交付";
    summaryPrimaryValue = `${deliveryDueSoonCount} 单`;
    summarySecondaryLeftLabel = "待选片";
    summarySecondaryLeftValue = `${metrics.deliveryActive.filter((order) => order.status === "待选片").length} 单`;
    summarySecondaryRightLabel = "待交付";
    summarySecondaryRightValue = `${metrics.deliveryActive.filter((order) => order.status === "待交付").length} 单`;
  } else if (user.role === "photographer") {
    headlineCards = [
      {
        label: "本周拍摄场次",
        value: `${metrics.weeklyShoots.length} 场`,
        change: `${metrics.weeklyShoots.filter((order) => !order.photographer).length} 场待配人`,
        detail: "未来 7 天内需要执行的拍摄任务",
      },
      {
        label: "待安排摄影师",
        value: `${metrics.weeklyShoots.filter((order) => !order.photographer).length} 场`,
        change: `${metrics.reminderBreakdown.shoot} 条拍摄提醒`,
        detail: "还没有明确摄影师安排的本周场次",
      },
      {
        label: "今日待办",
        value: `${highPriorityReminderCount} 条`,
        change: `${metrics.reminderBreakdown.shoot} 条拍摄提醒`,
        detail: "优先处理今天和明天要拍的高优先级事项",
      },
      {
        label: "待交付协作",
        value: `${metrics.deliveryActive.length} 单`,
        change: `${metrics.reminderBreakdown.delivery} 条交付提醒`,
        detail: "已拍完成后需要协同选片和交付的订单数量",
      },
    ];
    focusOrders = metrics.weeklyShoots.slice(0, 6);
    focusTitle = "本周重点执行订单";
    focusDescription = "优先关注临近拍摄、未安排摄影师或提醒较多的订单";
    focusEmptyText = "当前本周没有待执行的拍摄任务。";
    focusHref = "/schedule";
    reminderPanelTitle = "执行提醒分布";
    reminderPanelDescription = "先看拍摄提醒，再看需要配合交付的任务";
    summaryPanelTitle = "协作摘要";
    summaryPanelDescription = "帮助摄影师理解哪些单回款、交付和执行协同最紧张";
    summaryPrimaryLabel = "待交付订单";
    summaryPrimaryValue = `${metrics.deliveryActive.length} 单`;
    summarySecondaryLeftLabel = "已安排摄影师";
    summarySecondaryLeftValue = `${metrics.weeklyShoots.filter((order) => order.photographer).length} 场`;
    summarySecondaryRightLabel = "待安排摄影师";
    summarySecondaryRightValue = `${metrics.weeklyShoots.filter((order) => !order.photographer).length} 场`;
  }

  return (
    <AdminShell
      activeHref="/"
      title={roleTitles[user.role]}
      description={roleDescriptions[user.role]}
    >
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,#1f433f_0%,#4d776d_38%,#f09168_100%)] px-6 py-7 text-white shadow-2xl shadow-orange-100/70">
        <p className="text-sm uppercase tracking-[0.28em] text-white/72">Business Dashboard</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h2 className="max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl">
              {user.role === "owner"
                ? "先看经营，再看执行。首页会优先告诉你签了多少、收了多少、这周要拍多少、还有哪些钱和交付没收回来。"
                : user.role === "sales"
                  ? "先盯新订单和客户提醒。首页优先告诉你今天哪些订单最需要销售跟进。"
                  : user.role === "production_manager"
                    ? "先看这周要拍什么、哪里导演和主辅拍还没补齐，再看哪些单会影响后续交付。"
                  : user.role === "finance_director"
                    ? "先看今天、当月和整体财务，再快速定位订单归属和执行团队归属。"
                    : user.role === "delivery_manager"
                      ? "先看哪些订单快到合同交付日期，再看哪些单还卡在拍摄执行或选片产出。"
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
                    : user.role === "production_manager"
                      ? `${missingCrewCount} 场`
                      : user.role === "delivery_manager"
                        ? `${deliveryDueSoonCount} 单`
                        : formatCurrency(
                            metrics.yearlyReceivedAmount -
                              metrics.yearlyRefundAmount -
                              metrics.yearlyCostAmount,
                          )}
                </p>
                <p className="text-sm text-white/78">
                  {user.role === "photographer"
                    ? "本周执行任务"
                    : user.role === "production_manager"
                      ? "执行待补场次"
                      : user.role === "delivery_manager"
                        ? "临近交付日期"
                        : "当前净流入"}
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
                {focusTitle}
              </p>
              <p className="mt-1 text-sm muted">
                {focusDescription}
              </p>
            </div>
            <Link
              href={focusHref}
              className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-medium hover:bg-white"
            >
              {focusHref === "/schedule"
                ? "打开拍摄排期"
                : focusHref === "/finance"
                  ? "打开账务流水"
                  : focusHref === "/delivery"
                    ? "打开交付中心"
                    : "打开提醒中心"}
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {focusOrders.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line)] bg-white/75 px-4 py-6 text-sm muted">
                {focusEmptyText}
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
                        {order.shootDate} · {order.status} · {order.director || "导演待安排"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#bc5f4a]">
                      {user.role === "photographer"
                        ? order.photographer || "待安排摄影师"
                        : user.role === "production_manager"
                          ? `主拍 ${order.photographer || "待安排"}`
                          : user.role === "delivery_manager"
                            ? `截止 ${order.deliveryDueDate || "待补充"}`
                            : user.role === "finance_director"
                              ? `待收 ${formatCurrency(order.outstandingAmount)}`
                        : `待收 ${formatCurrency(order.outstandingAmount)}`}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 muted">
                    {user.role === "photographer"
                      ? `${order.location || "地点待补充"} · 已收 ${order.paid} · ${order.school}`
                      : user.role === "production_manager"
                        ? `导演 ${order.director || "待安排"} · 摄像 ${order.leadVideographer || "待安排"} · ${order.school}`
                        : user.role === "delivery_manager"
                          ? `销售 ${order.salesOwner || "待补充"} · 导演 ${order.director || "待安排"} · ${order.status}`
                          : user.role === "finance_director"
                            ? `销售 ${order.salesOwner || "待补充"} · 主拍 ${order.photographer || "待安排"} · 总额 ${order.amount}`
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
                {reminderPanelTitle}
              </p>
              <p className="mt-1 text-sm muted">
                {reminderPanelDescription}
              </p>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">拍摄提醒</p>
                  <span className="text-sm font-semibold">{metrics.reminderBreakdown.shoot} 条</span>
                </div>
                <p className="mt-2 text-sm leading-6 muted">
                  {user.role === "production_manager"
                    ? "围绕今日、明日和待补执行团队的场次"
                    : user.role === "delivery_manager"
                      ? "用来判断拍摄进度是否会卡住交付时间"
                      : "围绕今日、明日和待配摄影师的场次"}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">财务提醒</p>
                  <span className="text-sm font-semibold">{metrics.reminderBreakdown.finance} 条</span>
                </div>
                <p className="mt-2 text-sm leading-6 muted">
                  {user.role === "photographer"
                    ? "摄影师不直接处理财务，但可以知道哪些订单需要先确认尾款"
                    : user.role === "sales"
                      ? "帮助销售识别本周还没跟上尾款和客户确认的订单"
                      : user.role === "finance_director"
                        ? "本周待收尾款、交付前未收齐和异常回款风险"
                    : "本周待收尾款和金额较高的风险订单"}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">交付提醒</p>
                  <span className="text-sm font-semibold">{metrics.reminderBreakdown.delivery} 条</span>
                </div>
                <p className="mt-2 text-sm leading-6 muted">
                  {user.role === "delivery_manager"
                    ? "待选片、待交付和临近合同交付日期的关键节点"
                    : "待选片和待交付订单里的关键节点"}
                </p>
              </div>
            </div>
          </section>

          <section className="soft-card rounded-[1.75rem] p-5">
            <div>
              <p className="text-sm font-semibold">
                {summaryPanelTitle}
              </p>
              <p className="mt-1 text-sm muted">
                {summaryPanelDescription}
              </p>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                <p className="text-sm font-semibold">{summaryPrimaryLabel}</p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--success)]">
                  {summaryPrimaryValue}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                  <p className="text-sm font-semibold">{summarySecondaryLeftLabel}</p>
                  <p className="mt-2 text-xl font-semibold text-[#bc5f4a]">
                    {summarySecondaryLeftValue}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                  <p className="text-sm font-semibold">{summarySecondaryRightLabel}</p>
                  <p className="mt-2 text-xl font-semibold text-[#bc5f4a]">
                    {summarySecondaryRightValue}
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
                : user.role === "production_manager"
                  ? "保留最需要补执行团队和排期确认的订单，方便快速下钻查看"
                  : user.role === "delivery_manager"
                    ? "保留最需要追交付日期和产出进度的订单，方便快速下钻查看"
                    : "保留最关键的最近订单，方便管理角色快速下钻查看"}
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
