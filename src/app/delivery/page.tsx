import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { DeliveryBoard } from "@/components/delivery-board";
import { requireSession } from "@/lib/auth";
import { buildDeliveryBuckets } from "@/lib/delivery";
import { getOrders } from "@/lib/order-store";

export default async function DeliveryPage() {
  const user = await requireSession(["owner", "production_manager", "delivery_manager"]);
  const orders = await getOrders();
  const buckets = buildDeliveryBuckets(orders);
  const outstandingActive = buckets.active.reduce(
    (sum, order) => sum + order.outstandingAmount,
    0,
  );
  const overdueCandidates = buckets.active.filter((order) => order.deliveryDueDate).length;
  const overdueSoon = buckets.active.filter((order) => {
    if (!order.deliveryDueDate) {
      return false;
    }

    const due = new Date(`${order.deliveryDueDate}T23:59:59`);
    const now = new Date();
    const inThreeDays = new Date(now);
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    return due <= inThreeDays;
  }).length;
  const deliveryTitle =
    user.role === "delivery_manager" ? "交付执行中心" : "交付中心";
  const deliveryDescription =
    user.role === "delivery_manager"
      ? "优先盯导演、拍摄执行与合同交付日期的衔接，避免照片产出和交付超期。"
      : "把待选片、待交付和已完成订单集中管理，避免交付节点和尾款节点脱节。";
  const deliveryAdvice =
    user.role === "delivery_manager"
      ? "先处理合同交付日期临近、但拍摄或选片仍未完全衔接的订单，再去处理尾款未收的交付单。"
      : "先处理待交付但仍未收齐尾款的订单，再推进待选片订单，能减少交片后催款的被动。";

  return (
    <AdminShell
      activeHref="/delivery"
      title={deliveryTitle}
      description={deliveryDescription}
      aside={
        <>
          <p className="text-sm font-semibold">交付建议</p>
          <p className="mt-2 text-sm leading-6 muted">{deliveryAdvice}</p>
        </>
      }
    >
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,#21443f_0%,#54786f_42%,#ef9b73_100%)] px-6 py-7 text-white shadow-2xl shadow-orange-100/70">
        <p className="text-sm uppercase tracking-[0.24em] text-white/74">Delivery</p>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">交付任务总览</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
          {user.role === "delivery_manager"
            ? "这一页会优先把导演、拍摄团队、合同交付日期和产出风险放到一起看。"
            : "交付中心把后半段流程拉直了：待选片、待交付和已完成会统一展示，方便你盯住交片与回款。"}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">待选片</p>
          <h3 className="mt-4 text-3xl font-semibold">{buckets.selectable.length} 单</h3>
          <p className="mt-3 text-sm leading-6 muted">已拍摄完成，等待家长或老师确认选片</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">待交付</p>
          <h3 className="mt-4 text-3xl font-semibold">{buckets.deliverable.length} 单</h3>
          <p className="mt-3 text-sm leading-6 muted">适合优先核对尾款、修图和云相册链接</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">
            {user.role === "delivery_manager" ? "临近交付日期" : "交付中待收"}
          </p>
          <h3 className="mt-4 text-3xl font-semibold">
            {user.role === "delivery_manager"
              ? `${overdueSoon} 单`
              : `¥${outstandingActive.toLocaleString("zh-CN")}`}
          </h3>
          <p className="mt-3 text-sm leading-6 muted">
            {user.role === "delivery_manager"
              ? `${overdueCandidates} 单已填写合同交付日期，建议优先盯近 3 天节点`
              : "待选片与待交付订单里尚未收回的金额"}
          </p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">已完成</p>
          <h3 className="mt-4 text-3xl font-semibold">{buckets.completed.length} 单</h3>
          <p className="mt-3 text-sm leading-6 muted">已完成交付与收尾的订单可在这里回看</p>
        </article>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="soft-card rounded-[1.75rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">待交付任务</p>
              <p className="mt-1 text-sm muted">建议先处理交片前仍有待收尾款的订单</p>
            </div>
            <Link
              href="/alerts"
              className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-medium hover:bg-white"
            >
              打开提醒中心
            </Link>
          </div>

          <div className="mt-5">
            <DeliveryBoard
              orders={buckets.deliverable}
              emptyText="当前没有待交付订单，后续完成修图或选片后会自动出现在这里。"
            />
          </div>
        </section>

        <section className="soft-card rounded-[1.75rem] p-5">
          <div>
            <p className="text-sm font-semibold">待选片任务</p>
            <p className="mt-1 text-sm muted">已拍完但还在等待客户确认选片的订单</p>
          </div>
          <div className="mt-5">
            <DeliveryBoard
              orders={buckets.selectable}
              emptyText="当前没有待选片订单，已拍摄完成的场次后续会自动汇总到这里。"
            />
          </div>
        </section>
      </div>

      <section className="soft-card rounded-[1.75rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">已完成交付</p>
            <p className="mt-1 text-sm muted">方便回看已结案订单和做老客户复购跟进</p>
          </div>
          <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold metric-accent">
            {buckets.completed.length} 单已完成
          </span>
        </div>

        <div className="mt-5">
          <DeliveryBoard
            orders={buckets.completed}
            emptyText="当前还没有已完成订单，后续把状态改为“已完成”后就会出现在这里。"
          />
        </div>
      </section>
    </AdminShell>
  );
}
