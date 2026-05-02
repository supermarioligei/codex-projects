import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { OrdersTable } from "@/components/orders-table";
import { canCreateOrders, filterOrdersForUser, requireSession } from "@/lib/auth";
import { getOrders } from "@/lib/order-store";
import type { OrderStatus } from "@/lib/mock-data";

function parseCurrency(value: string) {
  return Number(value.replace(/[^\d.-]/g, "")) || 0;
}

const orderStatuses: OrderStatus[] = ["待确认", "待拍摄", "待选片", "待交付", "已完成"];

function matchesSearch(order: Awaited<ReturnType<typeof getOrders>>[number], keyword: string) {
  if (!keyword) {
    return true;
  }

  const haystack = [
    order.customer,
    order.school,
    order.contact,
    order.campus,
    order.packageName,
    order.salesOwner ?? "",
    order.signingClerk ?? "",
    order.director ?? "",
    order.assistantPhotographer ?? "",
    order.leadVideographer ?? "",
    order.assistantVideographer ?? "",
    order.photographer ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(keyword.toLowerCase());
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    deleted?: string;
    q?: string;
    status?: string;
    photographer?: string;
  }>;
}) {
  const user = await requireSession();
  const params = await searchParams;
  const allOrders = filterOrdersForUser(await getOrders(), user);
  const searchKeyword = (params.q ?? "").trim();
  const selectedStatus = (params.status ?? "").trim();
  const selectedPhotographer = (params.photographer ?? "").trim();
  const orders = allOrders.filter((order) => {
    const statusMatches = !selectedStatus || order.status === selectedStatus;
    const photographerMatches =
      !selectedPhotographer || (order.photographer ?? "") === selectedPhotographer;

    return (
      statusMatches &&
      photographerMatches &&
      matchesSearch(order, searchKeyword)
    );
  });
  const photographerOptions = Array.from(
    new Set(
      allOrders
        .map((order) => order.photographer?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b, "zh-CN"));
  const summaryCards = [
    {
      label: "待拍摄",
      value: `${orders.filter((order) => order.status === "待拍摄").length} 单`,
      detail: "本周需要落实摄影师和交通",
    },
    {
      label: "待选片",
      value: `${orders.filter((order) => order.status === "待选片").length} 单`,
      detail: "已拍完，等待家长确认加选",
    },
    {
      label: "待交付",
      value: `${orders.filter((order) => order.status === "待交付").length} 单`,
      detail: "精修完成后需要上传云相册",
    },
    {
      label: "未收尾款",
      value: `¥${orders
        .reduce((sum, order) => sum + parseCurrency(order.amount) - parseCurrency(order.paid), 0)
        .toLocaleString("zh-CN")}`,
      detail: "可按学校/班级、城市分批跟进",
    },
  ];

  return (
    <AdminShell
      activeHref="/orders"
      title={user.role === "photographer" ? "我的拍摄订单" : "订单管理"}
      description={
        user.role === "photographer"
          ? "只显示已分配给你的订单，方便你专注查看拍摄和执行信息。"
          : "集中查看每个学校/班级和拍摄场次的进度、金额与回款状态。"
      }
      aside={
        <>
          <p className="text-sm font-semibold">跟进建议</p>
          <p className="mt-2 text-sm leading-6 muted">
            {user.role === "photographer"
              ? "先确认本周自己要拍的场次，再补齐器材、联系人和出发安排。"
              : "先处理明后两天要拍摄的班级，再逐个催收待交付订单的尾款，避免交片后回款被动。"}
          </p>
        </>
      }
    >
      {params.created === "1" ? (
        <section className="rounded-[1.5rem] border border-[#cfe7db] bg-[#f2fbf6] px-5 py-4 text-sm text-[#25644d]">
          订单已保存，列表已经同步更新。下一步可以继续补账务流水和订单详情。
        </section>
      ) : null}
      {params.deleted === "1" ? (
        <section className="rounded-[1.5rem] border border-[#cfe7db] bg-[#f2fbf6] px-5 py-4 text-sm text-[#25644d]">
          订单已删除，列表、排期和提醒视图已经同步刷新。
        </section>
      ) : null}

      <div className="flex flex-col gap-4 rounded-[2rem] bg-[linear-gradient(135deg,#fff8f0_0%,#fffdf9_55%,#eef7f4_100%)] px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] muted">Orders</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            订单总览与跟进
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 muted">
            {user.role === "photographer"
              ? "这一页只保留你自己要执行的订单，方便快速查看拍摄地点、时间和协作状态。"
              : "这一页会成为业务主操作页，后面我们可以继续加筛选、搜索、状态编辑和订单详情抽屉。"}
          </p>
        </div>
        {canCreateOrders(user.role) ? (
          <Link
            href="/orders/new"
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105"
          >
            新建订单
          </Link>
        ) : null}
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
            <p className="text-sm font-semibold">全部订单</p>
            <p className="mt-1 text-sm muted">
              {user.role === "photographer"
                ? "如果当前没有订单，通常说明这几天还没有把场次分配到你的名字。"
                : "现在已经支持本地持久化录入，后面再切数据库时可以直接复用这套页面结构。"}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm">
              <p className="muted">城市筛选</p>
              <p className="mt-1 font-medium">{new Set(orders.map((order) => order.campus)).size} 个城市</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm">
              <p className="muted">订单状态</p>
              <p className="mt-1 font-medium">
                {new Set(orders.map((order) => order.status)).size || 0} 种状态
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm">
              <p className="muted">拍摄日期</p>
              <p className="mt-1 font-medium">按时间升序</p>
            </div>
          </div>
        </div>

        <form className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_0.9fr_0.9fr_auto]">
          <label className="text-sm font-medium">
            搜索订单
            <input
              name="q"
              defaultValue={searchKeyword}
              className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#93a09d] focus:border-[color:var(--accent)]"
              placeholder="按学校/班级、联系方式、联系人、签单客服、城市、摄影师搜索"
            />
          </label>

          <label className="text-sm font-medium">
            订单状态
            <select
              name="status"
              defaultValue={selectedStatus}
              className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
            >
              <option value="">全部状态</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            摄影师
            <select
              name="photographer"
              defaultValue={selectedPhotographer}
              className="mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
            >
              <option value="">全部摄影师</option>
              {photographerOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-3">
            <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105">
              应用筛选
            </button>
            <Link
              href="/orders"
              className="rounded-full border border-[color:var(--line)] px-5 py-3 text-sm font-semibold hover:bg-white"
            >
              重置
            </Link>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-3 text-sm muted">
          <span>当前结果：{orders.length} 单</span>
          {searchKeyword ? <span>关键词：{searchKeyword}</span> : null}
          {selectedStatus ? <span>状态：{selectedStatus}</span> : null}
          {selectedPhotographer ? <span>摄影师：{selectedPhotographer}</span> : null}
        </div>

        <div className="mt-5">
          <OrdersTable
            orders={orders}
            emptyText={
              user.role === "photographer"
                ? "当前还没有分配给你的订单。客服或老板安排摄影师后，这里会自动出现。"
                : "当前没有订单数据。"
            }
          />
        </div>
      </section>
    </AdminShell>
  );
}
