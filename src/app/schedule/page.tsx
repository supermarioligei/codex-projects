import { AdminShell } from "@/components/admin-shell";
import { ScheduleBoard } from "@/components/schedule-board";
import { filterOrdersForUser, requireSession } from "@/lib/auth";
import { buildScheduleBuckets } from "@/lib/schedule";
import { getOrders } from "@/lib/order-store";

export default async function SchedulePage() {
  const user = await requireSession();
  const orders = filterOrdersForUser(await getOrders(), user);
  const buckets = buildScheduleBuckets(orders);
  const thisWeekRevenue = buckets.thisWeek.reduce(
    (sum, order) => sum + order.receivedTotal,
    0,
  );

  return (
    <AdminShell
      activeHref="/schedule"
      title={user.role === "photographer" ? "我的拍摄排期" : "拍摄排期"}
      description={
        user.role === "photographer"
          ? "只显示分配给你的拍摄任务，方便你专注看今天、明天和本周要执行的场次。"
          : "按今日、明日和本周视角查看即将执行的拍摄任务，提前发现人员和回款风险。"
      }
      aside={
        <>
          <p className="text-sm font-semibold">排期建议</p>
          <p className="mt-2 text-sm leading-6 muted">
            {user.role === "photographer"
              ? "先确认自己本周的场次、出发时间和联系人，再把明天要拍的细节提前对齐。"
              : "先补齐本周未分配摄影师的场次，再对待收尾款较高的订单提前确认拍摄与交付节奏。"}
          </p>
        </>
      }
    >
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,#1f4741_0%,#4f7a70_42%,#ef936b_100%)] px-6 py-7 text-white shadow-2xl shadow-orange-100/70">
        <p className="text-sm uppercase tracking-[0.24em] text-white/74">Schedule</p>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">拍摄任务总览</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
          {user.role === "photographer"
            ? "你在这里看到的是分配给自己的拍摄任务。后面我们还会继续加个人日历、器材清单和拍摄确认。"
            : "当前排期基于订单拍摄日期自动生成。后面我们还可以继续加摄影师日历、冲突检测和提前提醒。"}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">今日拍摄</p>
          <h3 className="mt-4 text-3xl font-semibold">{buckets.today.length} 场</h3>
          <p className="mt-3 text-sm leading-6 muted">需要优先确认现场负责人和器材清单</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">明日拍摄</p>
          <h3 className="mt-4 text-3xl font-semibold">{buckets.tomorrow.length} 场</h3>
          <p className="mt-3 text-sm leading-6 muted">适合今天提前发送提醒和路线安排</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">本周排期</p>
          <h3 className="mt-4 text-3xl font-semibold">{buckets.thisWeek.length} 场</h3>
          <p className="mt-3 text-sm leading-6 muted">未来 7 天内的全部拍摄任务</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">待安排摄影师</p>
          <h3 className="mt-4 text-3xl font-semibold">{buckets.unassigned.length} 场</h3>
          <p className="mt-3 text-sm leading-6 muted">
            本周关联实收 ¥{thisWeekRevenue.toLocaleString("zh-CN")}
          </p>
        </article>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <section className="soft-card rounded-[1.75rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">本周拍摄清单</p>
              <p className="mt-1 text-sm muted">按时间升序展示未来 7 天的场次</p>
            </div>
            <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold metric-accent">
              {buckets.thisWeek.length} 场待执行
            </span>
          </div>

          <div className="mt-5">
            <ScheduleBoard orders={buckets.thisWeek} />
          </div>
        </section>

        <div className="space-y-4">
          <section className="soft-card rounded-[1.75rem] p-5">
            <div>
              <p className="text-sm font-semibold">今日提醒</p>
              <p className="mt-1 text-sm muted">适合在早会或出发前快速检查</p>
            </div>
            <div className="mt-5 space-y-3">
              <article className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                <p className="text-sm font-semibold">确认器材</p>
                <p className="mt-2 text-sm leading-6 muted">
                  检查机身、电池、存储卡、灯光、反光板和班级号牌是否齐全。
                </p>
              </article>
              <article className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                <p className="text-sm font-semibold">确认联系人</p>
                <p className="mt-2 text-sm leading-6 muted">
                  提前 1 小时联系老师，确认班级集合时间、天气预案和场地开放情况。
                </p>
              </article>
              <article className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4">
                <p className="text-sm font-semibold">确认回款节点</p>
                <p className="mt-2 text-sm leading-6 muted">
                  对待收金额较高的场次，在拍摄前再次确认尾款节点和交付条件。
                </p>
              </article>
            </div>
          </section>

          <section className="soft-card rounded-[1.75rem] p-5">
            <div>
              <p className="text-sm font-semibold">明日重点</p>
              <p className="mt-1 text-sm muted">提前一天完成沟通最省心</p>
            </div>
            <div className="mt-5">
              <ScheduleBoard orders={buckets.tomorrow} />
            </div>
          </section>
        </div>
      </div>

      <section className="soft-card rounded-[1.75rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">全部未来排期</p>
            <p className="mt-1 text-sm muted">把后续所有待拍摄订单按时间排出来，方便做月度安排</p>
          </div>
          <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-semibold">
            {buckets.upcoming.length} 场未来任务
          </span>
        </div>

        <div className="mt-5">
          <ScheduleBoard orders={buckets.upcoming} />
        </div>
      </section>
    </AdminShell>
  );
}
