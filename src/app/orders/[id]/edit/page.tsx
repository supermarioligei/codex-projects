import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { updateOrderAction } from "@/app/orders/[id]/edit/actions";
import { getOrderById } from "@/lib/order-store";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#93a09d] focus:border-[color:var(--accent)]";

function toDatetimeLocalValue(value: string) {
  return value ? value.replace(" ", "T") : "";
}

export default async function EditOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <AdminShell
      activeHref="/orders"
      title="编辑订单"
      description="修改订单基础资料、拍摄安排与状态，已收金额仍由关联流水自动汇总。"
      aside={
        <>
          <p className="text-sm font-semibold">编辑说明</p>
          <p className="mt-2 text-sm leading-6 muted">
            如果要调整实收金额，请去登记或修改关联流水；这里主要维护订单本身的信息。
          </p>
        </>
      }
    >
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,#244944_0%,#4b786e_42%,#ef8f68_100%)] px-6 py-7 text-white shadow-2xl shadow-orange-100/70">
        <p className="text-sm uppercase tracking-[0.24em] text-white/74">Edit Order</p>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{order.customer}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
          修改学校、班级、拍摄日期、订单金额、状态、摄影师和备注等信息。
        </p>
      </div>

      <section className="soft-card rounded-[1.75rem] p-5">
        {query.error === "missing" ? (
          <div className="mb-5 rounded-2xl border border-[#f0c8b2] bg-[#fff4ee] px-4 py-3 text-sm text-[#a3512d]">
            请先补全客户名称、联系人、学校、班级、拍摄日期和套餐类型这些必填项。
          </div>
        ) : null}

        <form action={updateOrderAction}>
          <input type="hidden" name="orderId" value={order.id} />

          <div className="grid gap-5 lg:grid-cols-2">
            <label className="text-sm font-medium">
              客户名称 / 订单标题
              <input
                name="customer"
                required
                defaultValue={order.customer}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              联系人
              <input
                name="contact"
                required
                defaultValue={order.contact}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              学校 / 机构
              <input
                name="school"
                required
                defaultValue={order.school}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              园区 / 校区
              <input name="campus" defaultValue={order.campus} className={fieldClassName} />
            </label>
            <label className="text-sm font-medium">
              班级
              <input
                name="className"
                required
                defaultValue={order.className}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              拍摄地点
              <input
                name="location"
                defaultValue={order.location}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              拍摄日期
              <input
                name="shootDate"
                required
                type="datetime-local"
                defaultValue={toDatetimeLocalValue(order.shootDate)}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              套餐类型
              <select
                name="packageName"
                required
                defaultValue={order.packageName}
                className={fieldClassName}
              >
                <option>毕业纪念全套</option>
                <option>班级合影 + 外景</option>
                <option>毕业典礼跟拍</option>
                <option>证件照 + 集体照</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              订单金额
              <input
                name="amount"
                defaultValue={String(
                  Number(order.amount.replace(/[^\d.-]/g, "")) || 0,
                )}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              已收金额
              <input
                disabled
                value={order.paid}
                className={`${fieldClassName} cursor-not-allowed bg-[#f8f2ea] text-[#7d7a74]`}
              />
            </label>
            <label className="text-sm font-medium">
              订单状态
              <select name="status" defaultValue={order.status} className={fieldClassName}>
                <option>待确认</option>
                <option>待拍摄</option>
                <option>待选片</option>
                <option>待交付</option>
                <option>已完成</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              摄影师安排
              <input
                name="photographer"
                defaultValue={order.photographer ?? ""}
                className={fieldClassName}
              />
            </label>
          </div>

          <label className="mt-5 block text-sm font-medium">
            备注
            <textarea
              name="notes"
              defaultValue={order.notes ?? ""}
              className={`${fieldClassName} min-h-32 resize-y`}
            />
          </label>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105">
              保存修改
            </button>
            <Link
              href={`/orders/${order.id}`}
              className="rounded-full border border-[color:var(--line)] px-5 py-3 text-center text-sm font-semibold hover:bg-white"
            >
              返回订单详情
            </Link>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}
